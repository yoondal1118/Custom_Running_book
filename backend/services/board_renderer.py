"""
보드판 HTML 생성 + Playwright PNG 변환
"""
import os
import calendar
from playwright.sync_api import sync_playwright

GRADE_COLORS = {
    "gold":   {"bg": "#FFF3CD", "border": "#B8940C", "text": "#7A5A00", "label": "금"},
    "silver": {"bg": "#F0F0F8", "border": "#8888A0", "text": "#3A3A50", "label": "은"},
    "bronze": {"bg": "#FDF0E8", "border": "#B87040", "text": "#6B3A18", "label": "동"},
    "blue":   {"bg": "#EDF4FF", "border": "#378ADD", "text": "#0C447C", "label": "파랑"},
    "none":   {"bg": "#FAFAFA", "border": "#E0E0E0", "text": "#CCCCCC", "label": ""},
}

def get_grade(km: float) -> str:
    if km <= 0:   return "none"
    elif km < 5:  return "bronze"
    elif km < 10: return "silver"
    elif km < 20: return "blue"
    else:         return "gold"

def html_to_png(html: str, output_path: str, width: int = 2400, height: int = 1200):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_viewport_size({"width": width, "height": height})
        page.set_content(html, wait_until="networkidle")
        real_h = page.evaluate("document.body.scrollHeight")
        page.set_viewport_size({"width": width, "height": max(real_h, height)})
        page.screenshot(path=output_path, full_page=False, clip={"x":0,"y":0,"width":width,"height":max(real_h,height)})
        browser.close()

def build_board_html(year: int, month: int, day_map: dict, book_title: str) -> str:
    days_in_month = calendar.monthrange(year, month)[1]
    total_km = sum(float(r.get("km", 0)) for r in day_map.values())
    medal_counts = {"gold": 0, "silver": 0, "bronze": 0, "blue": 0}
    for r in day_map.values():
        g = get_grade(float(r.get("km", 0)))
        if g in medal_counts:
            medal_counts[g] += 1

    cells_html = '<div class="cell start-cell"><div class="start-label">Start</div></div>'
    for day in range(1, days_in_month + 1):
        r = day_map.get(day)
        if r:
            km = float(r.get("km", 0))
            pace = r.get("pace", "")
            grade = get_grade(km)
            c = GRADE_COLORS[grade]
            cells_html += f'''<div class="cell run-cell" style="background:{c["bg"]};border-color:{c["border"]};">
                <div class="cell-num" style="color:{c["border"]};">{day}</div>
                <div class="cell-km" style="color:{c["text"]};">{km}km</div>
                <div class="cell-pace" style="color:{c["text"]};">{pace}</div>
            </div>'''
        else:
            cells_html += f'<div class="cell empty-cell"><div class="cell-num">{day}</div></div>'

    medals_html = "".join([
        f'<div class="medal-item"><div class="medal-dot" style="background:{GRADE_COLORS[g]["border"]};"></div>'
        f'<span>{GRADE_COLORS[g]["label"]} {medal_counts[g]}회</span></div>'
        for g in ["gold","silver","blue","bronze"] if medal_counts[g] > 0
    ])

    legend_items = [
        ("gold",   "금 (20km+)",    "오늘은 당신이 챔피언!"),
        ("silver", "은 (5~10km)",   "꾸준히 달리는 당신, 멋져요!"),
        ("blue",   "파랑 (10~20km)","한 걸음씩, 자랑스러운 기록!"),
        ("bronze", "동 (0~5km)",    "산책도 운동의 일부! 응원해요"),
    ]
    legend_html = "".join([
        f'<div class="legend-row"><div class="legend-box" style="background:{GRADE_COLORS[g]["bg"]};border-color:{GRADE_COLORS[g]["border"]};"></div>'
        f'<div><div class="legend-name" style="color:{GRADE_COLORS[g]["text"]};">{label}</div>'
        f'<div class="legend-desc">{desc}</div></div></div>'
        for g, label, desc in legend_items
    ])

    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:2400px;height:1200px;background:#FAFAF8;font-family:'Noto Sans KR',sans-serif;display:flex;overflow:hidden;}}
.left-page{{width:1200px;height:1200px;padding:60px;background:#1A1612;display:flex;flex-direction:column;justify-content:center;}}
.month-header{{margin-bottom:32px;}}
.month-year{{font-size:14px;color:rgba(255,255,255,0.35);letter-spacing:3px;margin-bottom:6px;}}
.month-title{{font-size:64px;font-weight:700;color:#fff;line-height:1;}}
.month-title span{{color:#E8632A;}}
.month-book{{font-size:12px;color:rgba(255,255,255,0.25);margin-top:8px;font-weight:300;}}
.summary-box{{background:rgba(232,99,42,0.1);border:1px solid rgba(232,99,42,0.25);padding:20px 24px;margin-bottom:28px;border-radius:6px;}}
.summary-km{{font-size:32px;font-weight:700;color:#fff;margin-bottom:8px;}}
.summary-km span{{color:#E8632A;}}
.medals{{display:flex;flex-wrap:wrap;gap:12px;}}
.medal-item{{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,0.6);}}
.medal-dot{{width:10px;height:10px;border-radius:50%;}}
.legend{{display:grid;grid-template-columns:1fr 1fr;gap:10px;}}
.legend-row{{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);padding:10px 12px;border-radius:6px;}}
.legend-box{{width:24px;height:24px;min-width:24px;border-radius:3px;border:1.5px solid;}}
.legend-name{{font-size:12px;font-weight:500;color:#fff;}}
.legend-desc{{font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px;}}
.right-page{{width:1200px;height:1200px;padding:60px;background:#FAFAF8;}}
.board-header{{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #E8632A;}}
.board-title{{font-size:18px;font-weight:700;color:#1A1612;}}
.board-sub{{font-size:12px;color:#888;}}
.board{{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;}}
.cell{{border:1.5px solid #E0DDD6;border-radius:6px;padding:10px 8px;min-height:130px;background:#FAFAFA;}}
.start-cell{{background:#1A1612;border-color:#E8632A;display:flex;align-items:center;justify-content:center;}}
.start-label{{color:#E8632A;font-size:14px;font-weight:700;letter-spacing:1px;}}
.run-cell{{border-width:2px;}}
.cell-num{{font-size:11px;font-weight:700;color:#CCCCCC;margin-bottom:6px;}}
.run-cell .cell-num{{color:inherit;}}
.cell-km{{font-size:14px;font-weight:700;margin-bottom:3px;}}
.cell-pace{{font-size:11px;font-weight:300;}}
.empty-cell .cell-num{{color:#CCCCCC;}}
</style></head>
<body>
<div class="left-page">
  <div class="month-header">
    <div class="month-year">{year}</div>
    <div class="month-title">{month}<span>월</span></div>
    <div class="month-book">{book_title}</div>
  </div>
  <div class="summary-box">
    <div class="summary-km">총 <span>{round(total_km,1)}km</span> 달렸어요</div>
    <div class="medals">{medals_html if medals_html else '<span style="font-size:13px;color:rgba(255,255,255,0.3);">이번 달 기록 없음</span>'}</div>
  </div>
  <div class="legend">{legend_html}</div>
</div>
<div class="right-page">
  <div class="board-header">
    <div class="board-title">{year}년 {month}월 러닝 보드</div>
    <div class="board-sub">{days_in_month}일</div>
  </div>
  <div class="board">{cells_html}</div>
</div>
</body></html>"""


def build_stats_html(book_title: str, record_year: int, total_km: float, fun_stats: dict) -> str:
    earth_laps = fun_stats.get("earth_laps", 0)
    everest = fun_stats.get("everest_count", 0)
    steps = int(total_km * 1000 / 0.75)  # 평균 보폭 75cm

    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:1200px;height:1200px;background:#1A1612;font-family:'Noto Sans KR',sans-serif;padding:80px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;}}
.eyebrow{{font-size:12px;color:rgba(255,255,255,0.3);letter-spacing:4px;margin-bottom:16px;}}
.main-title{{font-size:52px;font-weight:700;color:#fff;line-height:1.1;margin-bottom:8px;}}
.main-title em{{color:#E8632A;font-style:normal;}}
.subtitle{{font-size:14px;color:rgba(255,255,255,0.35);margin-bottom:56px;font-weight:300;}}
.stats-grid{{display:grid;grid-template-columns:1fr 1fr;gap:20px;}}
.stat-card{{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:28px 24px;}}
.stat-icon{{font-size:36px;margin-bottom:12px;}}
.stat-val{{font-size:36px;font-weight:700;color:#fff;margin-bottom:4px;line-height:1;}}
.stat-val em{{color:#E8632A;font-style:normal;font-size:20px;}}
.stat-label{{font-size:13px;color:rgba(255,255,255,0.4);font-weight:300;}}
.stat-comment{{font-size:11px;color:rgba(255,255,255,0.2);margin-top:8px;font-weight:300;line-height:1.5;}}
.total-bar{{background:rgba(232,99,42,0.12);border:1px solid rgba(232,99,42,0.25);border-radius:10px;padding:24px;margin-top:20px;display:flex;align-items:center;gap:20px;}}
.total-km{{font-size:48px;font-weight:700;color:#E8632A;}}
.total-unit{{font-size:20px;color:rgba(255,255,255,0.5);}}
.total-desc{{font-size:13px;color:rgba(255,255,255,0.4);font-weight:300;}}
</style></head>
<body>
<div class="eyebrow">{record_year} RUNNING JOURNAL</div>
<div class="main-title">나의 <em>러닝</em><br />기록 요약</div>
<div class="subtitle">{book_title}</div>
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-icon">🌍</div>
    <div class="stat-val">{earth_laps}<em>바퀴</em></div>
    <div class="stat-label">지구를 돈 횟수</div>
    <div class="stat-comment">지구 둘레 40,075km 기준</div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">⛰️</div>
    <div class="stat-val">{everest}<em>회</em></div>
    <div class="stat-label">에베레스트 정복 횟수</div>
    <div class="stat-comment">에베레스트 높이 8.849km 기준</div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">👟</div>
    <div class="stat-val">{steps:,}<em>보</em></div>
    <div class="stat-label">총 걸음 수</div>
    <div class="stat-comment">평균 보폭 75cm 기준</div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">🏃</div>
    <div class="stat-val">{round(total_km,1)}<em>km</em></div>
    <div class="stat-label">총 달린 거리</div>
    <div class="stat-comment">{record_year}년 한 해 동안</div>
  </div>
</div>
<div class="total-bar">
  <div>
    <div class="total-km">{round(total_km,1)}</div>
    <div class="total-unit">km</div>
  </div>
  <div class="total-desc">
    당신은 {record_year}년 한 해 동안<br />
    총 <strong style="color:#E8632A;">{round(total_km,1)}km</strong>를 달렸습니다.<br />
    정말 대단해요!
  </div>
</div>
</body></html>"""


def render_board_page(year: int, month: int, day_map: dict, book_title: str, output_path: str):
    html = build_board_html(year, month, day_map, book_title)
    html_to_png(html, output_path, width=2400, height=1200)


def render_stats_page(book_title: str, record_year: int, total_km: float, fun_stats: dict, output_path: str):
    html = build_stats_html(book_title, record_year, total_km, fun_stats)
    html_to_png(html, output_path, width=1200, height=1200)


def render_cover_page(book_title: str, record_year: int, total_km: float, output_path: str):
    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&display=swap');
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:1200px;height:1600px;background:#1A1612;font-family:'Noto Sans KR',sans-serif;
display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;}}
.stripe{{position:absolute;left:0;top:0;bottom:0;width:12px;background:#E8632A;}}
.content{{text-align:center;padding:60px;}}
.year{{font-size:20px;color:rgba(255,255,255,0.3);letter-spacing:6px;margin-bottom:32px;}}
h1{{font-size:88px;font-weight:700;color:#fff;line-height:1.1;margin-bottom:20px;}}
h1 em{{color:#E8632A;font-style:normal;}}
.stat{{font-size:18px;color:rgba(255,255,255,0.5);font-weight:300;line-height:2.2;}}
.stat strong{{color:#E8632A;font-size:26px;font-weight:700;}}
.deco{{position:absolute;bottom:48px;right:48px;font-size:12px;color:rgba(255,255,255,0.15);letter-spacing:3px;}}
</style></head>
<body>
<div class="stripe"></div>
<div class="content">
  <div class="year">{record_year}</div>
  <h1>나의<br /><em>러닝</em><br />일지</h1>
  <div class="stat">
    총 <strong>{round(total_km,1)}km</strong> 달렸어요<br />
    지구를 <strong>{round(total_km/40075,2)}</strong>바퀴 돌았어요
  </div>
</div>
<div class="deco">MY RUNNING JOURNAL</div>
</body></html>"""
    html_to_png(html, output_path, width=1200, height=1600)