import asyncio
import os
import json
import calendar
import requests
import base64
from dotenv import load_dotenv
from services.board_renderer import (
    render_board_page, render_stats_page, render_cover_page,
    render_appendix_page, get_grade
)

load_dotenv()

API_KEY  = os.getenv("BOOKPRINT_API_KEY")
BASE_URL = os.getenv("BOOKPRINT_BASE_URL", "https://api-sandbox.sweetbook.com/v1")

COVER_TEMPLATE   = "4MY2fokVjkeY"
CONTENT_TEMPLATE = "y5Ih0Uo7tuQ3"

BASE_PRICE     = 12000
APPENDIX_PRICE = 3000

def _headers():
    return {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

def _post(path, data):
    resp = requests.post(f"{BASE_URL}{path}", json=data, headers=_headers())
    if not resp.ok:
        raise Exception(f"API 오류 [{resp.status_code}] {path}: {resp.text}")
    return resp.json()

def _post_multipart(path, data, files=None):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    if files is None:
        files = {"dummy": ("", b"", "application/octet-stream")}
    resp = requests.post(f"{BASE_URL}{path}", headers=headers, data=data, files=files)
    if not resp.ok:
        raise Exception(f"API 오류 [{resp.status_code}] {path}: {resp.text}")
    return resp.json()

def calc_fun_stats(total_km: float) -> dict:
    return {
        "total_km":      round(total_km, 1),
        "earth_laps":    round(total_km / 40075, 2),
        "everest_count": round(total_km / 8.849, 1),
    }

def group_by_month(run_records: list) -> dict:
    monthly = {}
    for r in run_records:
        if not r.get("date") or not r.get("km"):
            continue
        ym = r["date"][:7]
        if ym not in monthly:
            monthly[ym] = []
        monthly[ym].append(r)
    return monthly

def count_medals(run_records: list) -> dict:
    counts = {"gold": 0, "silver": 0, "bronze": 0, "blue": 0}
    for r in run_records:
        g = get_grade(float(r.get("km", 0)))
        if g in counts:
            counts[g] += 1
    return counts

def calc_price(has_appendix: bool) -> dict:
    total = BASE_PRICE + (APPENDIX_PRICE if has_appendix else 0)
    return {
        "base_price":      BASE_PRICE,
        "appendix_price":  APPENDIX_PRICE if has_appendix else 0,
        "has_appendix":    has_appendix,
        "total_price":     total,
    }

def upload_photo(book_uid: str, image_path: str) -> str:
    with open(image_path, "rb") as f:
        resp = _post_multipart(
            f"/books/{book_uid}/photos",
            data={},
            files=[("file", (os.path.basename(image_path), f, "image/png"))]
        )
    return resp["data"]["fileName"]

def add_content_page(book_uid: str, photo_files: list, date_label: str = ""):
    _post_multipart(
        f"/books/{book_uid}/contents",
        data={
            "templateUid": CONTENT_TEMPLATE,
            "parameters": json.dumps({
                "date":          date_label,
                "collagePhotos": photo_files,
            }),
        }
    )

def image_to_base64(path: str) -> str:
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()

async def create_running_book(order_data: dict, progress=None) -> dict:
    import tempfile
    from PIL import Image

    async def report(step: str, pct: int, preview_url: str = None):
        if progress:
            await progress(step, pct, preview_url)

    run_records  = order_data.get("runRecords", [])
    book_title   = order_data.get("bookTitle") or "나의 러닝일지"
    record_year  = int(order_data.get("recordYear", 2024))
    selected_piece = order_data.get("selectedPiece", "blue")
    awards       = [a for a in order_data.get("awards", []) if a.get("name")]
    has_appendix = len(awards) > 0

    total_km     = sum(float(r.get("km", 0)) for r in run_records if r.get("km"))
    fun_stats    = calc_fun_stats(total_km)
    medal_counts = count_medals(run_records)
    monthly_data = group_by_month(run_records)

    await report("책 생성 중...", 2)

    book_resp = _post("/books", {
        "title":        book_title,
        "bookSpecUid":  "SQUAREBOOK_HC",
        "creationType": "TEST"
    })
    book_uid = book_resp["data"]["bookUid"]
    await report("책 생성 완료", 5)

    # 미리보기용 페이지 이미지 수집
    preview_pages = []   # {"label": "표지", "b64": "data:image/png;base64,..."}

    with tempfile.TemporaryDirectory() as tmpdir:

        # 표지
        await report("표지 생성 중...", 8)
        cover_path = os.path.join(tmpdir, "cover.png")
        await asyncio.to_thread(render_cover_page, book_title, record_year, total_km, cover_path)
        preview_pages.append({"label": "표지", "b64": image_to_base64(cover_path)})

        cover_file = upload_photo(book_uid, cover_path)
        _post_multipart(
            f"/books/{book_uid}/cover",
            data={
                "templateUid": COVER_TEMPLATE,
                "parameters": json.dumps({
                    "dateRange":  f"{record_year}.01.01 -\\n{record_year}.12.31",
                    "spineTitle": f"{record_year} Running Journal",
                    "frontPhoto": cover_file,
                }),
                "frontPhoto": cover_file,
            }
        )
        await report("표지 완료", 12)

        # 통계 페이지
        await report("통계 페이지 생성 중...", 15)
        stats_path = os.path.join(tmpdir, "stats.png")
        await asyncio.to_thread(render_stats_page, book_title, record_year, total_km, fun_stats, stats_path)
        preview_pages.append({"label": "총 기록", "b64": image_to_base64(stats_path)})

        stats_file = upload_photo(book_uid, stats_path)
        add_content_page(book_uid, [stats_file], f"{record_year} 요약")
        await report("통계 페이지 완료", 18)

        # 1~12월 보드판
        for month in range(1, 13):
            pct_start = 18 + (month - 1) * 6
            await report(f"{month}월 보드판 생성 중...", pct_start)

            ym      = f"{record_year}-{month:02d}"
            records = monthly_data.get(ym, [])
            day_map = {int(r["date"].split("-")[2]): r for r in records}

            board_path = os.path.join(tmpdir, f"board_{month:02d}.png")
            await asyncio.to_thread(render_board_page, record_year, month, day_map, book_title, board_path, selected_piece)

            # 보드판 전체(2페이지 펼침) 미리보기로 수집
            preview_pages.append({"label": f"{month}월", "b64": image_to_base64(board_path)})

            left_path  = os.path.join(tmpdir, f"board_{month:02d}_L.png")
            right_path = os.path.join(tmpdir, f"board_{month:02d}_R.png")

            img = Image.open(board_path)
            w, h = img.size
            img.crop((0, 0, w//2, h)).save(left_path)
            img.crop((w//2, 0, w, h)).save(right_path)

            left_file  = upload_photo(book_uid, left_path)
            right_file = upload_photo(book_uid, right_path)
            add_content_page(book_uid, [left_file],  f"{month}월")
            add_content_page(book_uid, [right_file], f"{month}월")

            await report(f"{month}월 보드판 완료", pct_start + 5)

        # 부록
        if has_appendix:
            await report("부록 페이지 생성 중...", 92)
            appendix_path = os.path.join(tmpdir, "appendix.png")
            await asyncio.to_thread(render_appendix_page, awards, book_title, appendix_path)
            preview_pages.append({"label": "부록", "b64": image_to_base64(appendix_path)})

            appendix_file = upload_photo(book_uid, appendix_path)
            add_content_page(book_uid, [appendix_file], "수상 경력")
            await report("부록 완료", 94)

        # 최종화
        await report("책 최종화 중...", 96)
        _post(f"/books/{book_uid}/finalization", {})
        await report("완료!", 100)

    return {
        "book_uid":      book_uid,
        "fun_stats":     fun_stats,
        "medal_counts":  medal_counts,
        "preview_pages": preview_pages,   # 전체 페이지 목록
        "preview_b64":   preview_pages[0]["b64"] if preview_pages else None,  # 하위 호환
    }