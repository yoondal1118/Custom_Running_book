import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from bookprintapi import Client
from dotenv import load_dotenv

load_dotenv()

client = Client(
    api_key=os.getenv("BOOKPRINT_API_KEY"),
    environment="sandbox"
)

# 러닝 기록 → 보드판 색상 결정
def get_cell_grade(km: float) -> str:
    if km <= 0:
        return "none"
    elif km < 5:
        return "bronze"   # 동 (0~5km)
    elif km < 10:
        return "silver"   # 은 (5~10km)
    elif km < 20:
        return "blue"     # 파랑 (10~20km)
    else:
        return "gold"     # 금 (20km+)

# 총 km → 재미 통계 계산
def calc_fun_stats(total_km: float) -> dict:
    earth_laps = round(total_km / 40075, 2)       # 지구 둘레 40,075km
    everest = round(total_km / 8.849, 1)          # 에베레스트 8.849km
    return {
        "total_km": round(total_km, 1),
        "earth_laps": earth_laps,
        "everest_count": everest,
    }

# 월별 데이터 그룹핑
def group_by_month(run_records: list) -> dict:
    monthly = {}
    for r in run_records:
        if not r.get("date") or not r.get("km"):
            continue
        ym = r["date"][:7]  # "2024-01"
        if ym not in monthly:
            monthly[ym] = []
        monthly[ym].append(r)
    return monthly

# 메달 카운트 집계
def count_medals(run_records: list) -> dict:
    counts = {"gold": 0, "silver": 0, "bronze": 0, "blue": 0}
    for r in run_records:
        km = float(r.get("km", 0))
        grade = get_cell_grade(km)
        if grade in counts:
            counts[grade] += 1
    return counts

async def create_running_book(order_data: dict) -> dict:
    """
    주문 데이터를 받아서 책 생성 → 표지 → 월별 보드판 페이지 → 최종화까지 처리
    """
    run_records = order_data.get("runRecords", [])
    book_title = order_data.get("bookTitle") or "나의 러닝일지"
    
    # 총 km 계산
    total_km = sum(float(r.get("km", 0)) for r in run_records if r.get("km"))
    fun_stats = calc_fun_stats(total_km)
    medal_counts = count_medals(run_records)
    monthly_data = group_by_month(run_records)

    # 1. 책 생성
    book_resp = client.books.create(
        book_spec_uid="SQUAREBOOK_HC",
        title=book_title,
        creation_type="TEST"
    )
    book_uid = book_resp["data"]["bookUid"]
    print(f"표지 추가 시도 — URL: /books/{book_uid}/cover")
    # 2. 표지 추가
    client.covers.create(
        book_uid,
        template_uid="tpl_F8d15af9fd",
        parameters={
            "title": book_title,
            "author": order_data.get("name", ""),
        }
    )

    # 3. 첫 페이지 — 총 기록 요약
    client.contents.insert(
        book_uid,
        template_uid="tpl_F8d15af9fd",
        parameters={
            "total_km": str(fun_stats["total_km"]),
            "earth_laps": str(fun_stats["earth_laps"]),
            "everest_count": str(fun_stats["everest_count"]),
            "gold_count": str(medal_counts["gold"]),
            "silver_count": str(medal_counts["silver"]),
            "bronze_count": str(medal_counts["bronze"]),
        },
        break_before="page"
    )

    # 4. 월별 보드판 페이지
    for ym, records in sorted(monthly_data.items()):
        year, month = ym.split("-")
        
        # 날짜별 기록 딕셔너리로 변환
        day_map = {}
        for r in records:
            day = int(r["date"].split("-")[2])
            day_map[day] = r

        # 보드판 파라미터 구성
        board_params = {
            "year": year,
            "month": f"{int(month)}월",
            "total_km": str(round(sum(float(r.get("km", 0)) for r in records), 1)),
        }

        # 각 날짜별 km/페이스 파라미터 추가
        for day in range(1, 32):
            if day in day_map:
                r = day_map[day]
                km = float(r.get("km", 0))
                board_params[f"day_{day}_km"] = str(km)
                board_params[f"day_{day}_pace"] = r.get("pace", "")
                board_params[f"day_{day}_grade"] = get_cell_grade(km)
            else:
                board_params[f"day_{day}_km"] = ""
                board_params[f"day_{day}_pace"] = ""
                board_params[f"day_{day}_grade"] = "none"

        client.contents.insert(
            book_uid,
            template_uid="tpl_F8d15af9fd",
            parameters=board_params,
            break_before="page"
        )

    # 5. 부록 페이지 (수상경력이 있을 경우)
    awards = order_data.get("awards", [])
    valid_awards = [a for a in awards if a.get("name")]
    if valid_awards:
        award_params = {}
        for i, award in enumerate(valid_awards[:6]):
            award_params[f"award_{i+1}_name"] = award.get("name", "")
            award_params[f"award_{i+1}_result"] = award.get("result", "")

        client.contents.insert(
            book_uid,
            template_uid="tpl_F8d15af9fd",
            parameters=award_params,
            break_before="page"
        )

    # 6. 책 최종화
    client.books.finalize(book_uid)

    return {
        "book_uid": book_uid,
        "fun_stats": fun_stats,
        "medal_counts": medal_counts,
    }
