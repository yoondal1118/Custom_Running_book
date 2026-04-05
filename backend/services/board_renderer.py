import os
import calendar
from playwright.sync_api import sync_playwright

# 1956 x 845 (템플릿 한 컬럼 978x845 x 2)
CANVAS_W = 1956
CANVAS_H = 845

GRADE = {
    "gold":   {"bg": "#F5C518", "border": "#B8940C", "text": "#5A3E00", "label": "금"},
    "silver": {"bg": "#C0C0C8", "border": "#888898", "text": "#2A2A3A", "label": "은"},
    "bronze": {"bg": "#CD7F32", "border": "#8B5A1A", "text": "#3A1A00", "label": "동"},
    "none":   {"bg": "rgba(255,255,255,0.15)", "border": "rgba(255,255,255,0.25)", "text": "rgba(255,255,255,0.5)", "label": ""},
}

def get_grade(km: float) -> str:
    if km <= 0:    return "none"
    elif km < 5:   return "bronze"
    elif km < 15:  return "silver"
    else:          return "gold"

def html_to_png(html: str, output_path: str, width: int = CANVAS_W, height: int = CANVAS_H):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_viewport_size({"width": width, "height": height})
        page.set_content(html, wait_until="networkidle")
        page.screenshot(path=output_path, clip={"x": 0, "y": 0, "width": width, "height": height})
        browser.close()

def build_board_html(year: int, month: int, day_map: dict, book_title: str) -> str:
    days_in_month = calendar.monthrange(year, month)[1]
    total_km = round(sum(float(r.get("km", 0)) for r in day_map.values()), 1)
    medal_counts = {"gold": 0, "silver": 0, "bronze": 0}
    for r in day_map.values():
        g = get_grade(float(r.get("km", 0)))
        if g in medal_counts:
            medal_counts[g] += 1

    # 보드판 칸 생성
    # 경로: 뱀 형태, 8칸씩 4줄
    # Row 0: Start → 1~7  (왼→오)
    # Row 1: 8~15         (오→왼)
    # Row 2: 16~23        (왼→오)
    # Row 3: 24~31        (오→왼)

    # 칸 크기 및 위치 계산
    PAD_L = 80   # 왼쪽 여백 (말/레이블 공간)
    PAD_R = 40
    PAD_T = 160  # 상단 헤더 여백
    PAD_B = 48

    board_w = CANVAS_W - PAD_L - PAD_R
    board_h = CANVAS_H - PAD_T - PAD_B

    cols = 8
    rows = 4
    cell_w = board_w // cols
    cell_h = board_h // rows

    # 경로 순서대로 (row, col) 위치 계산
    path = []
    path.append(("start", None))  # Start
    for row in range(rows):
        if row % 2 == 0:  # 왼→오
            for col in range(cols):
                path.append(("day", (row, col)))
        else:             # 오→왼
            for col in range(cols - 1, -1, -1):
                path.append(("day", (row, col)))

    # day 1~days_in_month 까지 매핑
    day_positions = {}
    day_num = 1
    for item in path:
        if item[0] == "day" and day_num <= days_in_month:
            day_positions[day_num] = item[1]
            day_num += 1

    def cell_x(col): return PAD_L + col * cell_w
    def cell_y(row): return PAD_T + row * cell_h

    # SVG 생성
    # 배경 경로 (연결된 트랙)
    # 각 칸 위치 순서대로 path points 계산
    track_points = []
    for i, item in enumerate(path):
        if item[0] == "start":
            track_points.append((PAD_L // 2, PAD_T + cell_h // 2))
        else:
            row, col = item[1]
            cx = cell_x(col) + cell_w // 2
            cy = cell_y(row) + cell_h // 2
            track_points.append((cx, cy))

    # 트랙 polyline 생성
    track_str = " ".join([f"{x},{y}" for x, y in track_points])

    # 셀 HTML 생성
    cells_html = ""

    # Start 칸
    start_cx = PAD_L // 2
    start_cy = PAD_T + cell_h // 2
    start_r = min(cell_w, cell_h) // 2 - 6
    cells_html += f'''
    <circle cx="{start_cx}" cy="{start_cy}" r="{start_r}"
      fill="#1A3A6E" stroke="#4A7DD4" stroke-width="3"/>
    <text x="{start_cx}" y="{start_cy - 6}" text-anchor="middle"
      fill="#fff" font-size="14" font-weight="bold" font-family="Noto Sans KR">Start</text>
    <!-- 말 -->
    <ellipse cx="{start_cx}" cy="{start_cy + start_r - 8}" rx="10" ry="5" fill="rgba(0,0,0,0.3)"/>
    <rect x="{start_cx - 6}" y="{start_cy - start_r + 2}" width="12" height="20" rx="6" fill="#E8632A"/>
    <circle cx="{start_cx}" cy="{start_cy - start_r - 8}" r="9" fill="#E8632A"/>
    <circle cx="{start_cx}" cy="{start_cy - start_r - 8}" r="5" fill="#F5A06B"/>
    '''

    # 날짜 칸
    cell_r = min(cell_w, cell_h) // 2 - 8
    for day in range(1, days_in_month + 1):
        if day not in day_positions:
            continue
        row, col = day_positions[day]
        cx = cell_x(col) + cell_w // 2
        cy = cell_y(row) + cell_h // 2

        rec = day_map.get(day)
        if rec:
            km = float(rec.get("km", 0))
            pace = rec.get("pace", "")
            grade = get_grade(km)
            g = GRADE[grade]
            cells_html += f'''
            <circle cx="{cx}" cy="{cy}" r="{cell_r}"
              fill="{g["bg"]}" stroke="{g["border"]}" stroke-width="2.5"/>
            <text x="{cx}" y="{cy - 14}" text-anchor="middle"
              fill="{g["text"]}" font-size="11" font-family="Noto Sans KR" font-weight="bold">{day}일</text>
            <text x="{cx}" y="{cy + 4}" text-anchor="middle"
              fill="{g["text"]}" font-size="13" font-family="Noto Sans KR" font-weight="bold">{km}km</text>
            <text x="{cx}" y="{cy + 19}" text-anchor="middle"
              fill="{g["text"]}" font-size="11" font-family="Noto Sans KR">{pace}</text>
            '''
        else:
            cells_html += f'''
            <circle cx="{cx}" cy="{cy}" r="{cell_r}"
              fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
            <text x="{cx}" y="{cy + 5}" text-anchor="middle"
              fill="rgba(255,255,255,0.45)" font-size="13" font-family="Noto Sans KR">{day}</text>
            '''

    # 꺾이는 화살표 (각 줄 끝)
    arrows_html = ""
    row_ends = [
        # row 0 끝 → row 1 시작 (오른쪽 끝에서 아래로)
        (cell_x(cols-1) + cell_w // 2 + cell_r + 4, PAD_T + cell_h // 2,
         cell_x(cols-1) + cell_w // 2 + cell_r + 4, PAD_T + cell_h + cell_h // 2),
        # row 1 끝 → row 2 시작 (왼쪽 끝에서 아래로)
        (PAD_L + cell_r + 4, PAD_T + cell_h + cell_h // 2,
         PAD_L + cell_r + 4, PAD_T + 2 * cell_h + cell_h // 2),
        # row 2 끝 → row 3 시작
        (cell_x(cols-1) + cell_w // 2 + cell_r + 4, PAD_T + 2 * cell_h + cell_h // 2,
         cell_x(cols-1) + cell_w // 2 + cell_r + 4, PAD_T + 3 * cell_h + cell_h // 2),
    ]
    for x1, y1, x2, y2 in row_ends:
        arrows_html += f'''
        <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"
          stroke="rgba(255,255,255,0.4)" stroke-width="2"
          marker-end="url(#arrow)" stroke-dasharray="4,3"/>
        '''

    # Finish 표시
    last_day = days_in_month
    if last_day in day_positions:
        row, col = day_positions[last_day]
        fx = cell_x(col) + cell_w // 2
        fy = cell_y(row) + cell_h // 2
        finish_x = fx + (cell_r + 30 if row % 2 == 0 else -(cell_r + 30))
        finish_html = f'''
        <rect x="{finish_x - 32}" y="{fy - 16}" width="64" height="32" rx="16"
          fill="#E8632A" opacity="0.9"/>
        <text x="{finish_x}" y="{fy + 5}" text-anchor="middle"
          fill="#fff" font-size="14" font-weight="bold" font-family="Noto Sans KR">Finish</text>
        '''
    else:
        finish_html = ""

    # 중앙 구분선
    mid_x = CANVAS_W // 2
    divider_html = f'''
    <line x1="{mid_x}" y1="20" x2="{mid_x}" y2="{CANVAS_H - 20}"
      stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="6,4"/>
    '''

    # 메달 집계 (우측 상단)
    medal_html = ""
    mx = CANVAS_W - 320
    my = 32
    for g_key, g_label in [("gold","금"),("silver","은"),("bronze","동")]:
        cnt = medal_counts[g_key]
        color = GRADE[g_key]["bg"]
        border = GRADE[g_key]["border"]
        medal_html += f'''
        <circle cx="{mx}" cy="{my + 10}" r="12" fill="{color}" stroke="{border}" stroke-width="1.5"/>
        <text x="{mx + 18}" y="{my + 15}" fill="rgba(255,255,255,0.8)"
          font-size="14" font-family="Noto Sans KR">{g_label} {cnt}개</text>
        '''
        mx += 90

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:{CANVAS_W}px;height:{CANVAS_H}px;overflow:hidden;background:#1B2A4A;}}
</style></head>
<body>
<svg width="{CANVAS_W}" height="{CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
    markerWidth="5" markerHeight="5" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="rgba(255,255,255,0.5)"
      stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </marker>
  <!-- 배경 패턴: 작은 도트 -->
  <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.06)"/>
  </pattern>
</defs>

<!-- 배경 -->
<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="#1B2A4A"/>
<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="url(#dots)"/>

<!-- 트랙 배경 (굵은 선) -->
<polyline points="{track_str}"
  fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="{min(cell_w,cell_h) - 10}"
  stroke-linejoin="round" stroke-linecap="round"/>

<!-- 트랙 테두리 -->
<polyline points="{track_str}"
  fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="{min(cell_w,cell_h) - 6}"
  stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="none"/>

<!-- 꺾임 화살표 -->
{arrows_html}

<!-- 셀들 -->
{cells_html}

<!-- Finish -->
{finish_html}

<!-- 구분선 -->
{divider_html}

<!-- 좌측 상단 헤더 -->
<text x="80" y="48" fill="#fff" font-size="22" font-weight="bold"
  font-family="Noto Sans KR">{year}년 {month}월 러닝 보드</text>
<text x="80" y="78" fill="#F5C518" font-size="18" font-family="Noto Sans KR">
  총 {total_km}km
</text>

<!-- 메달 집계 (우측) -->
{medal_html}

<!-- 범례 -->
<rect x="{mid_x + 20}" y="{CANVAS_H - 42}" width="12" height="12" rx="3"
  fill="{GRADE['bronze']['bg']}" stroke="{GRADE['bronze']['border']}" stroke-width="1"/>
<text x="{mid_x + 38}" y="{CANVAS_H - 33}" fill="rgba(255,255,255,0.5)"
  font-size="12" font-family="Noto Sans KR">동 ~5km</text>

<rect x="{mid_x + 110}" y="{CANVAS_H - 42}" width="12" height="12" rx="3"
  fill="{GRADE['silver']['bg']}" stroke="{GRADE['silver']['border']}" stroke-width="1"/>
<text x="{mid_x + 128}" y="{CANVAS_H - 33}" fill="rgba(255,255,255,0.5)"
  font-size="12" font-family="Noto Sans KR">은 5~15km</text>

<rect x="{mid_x + 210}" y="{CANVAS_H - 42}" width="12" height="12" rx="3"
  fill="{GRADE['gold']['bg']}" stroke="{GRADE['gold']['border']}" stroke-width="1"/>
<text x="{mid_x + 228}" y="{CANVAS_H - 33}" fill="rgba(255,255,255,0.5)"
  font-size="12" font-family="Noto Sans KR">금 15km+</text>

</svg>
</body></html>"""
    return html


def render_board_page(year: int, month: int, day_map: dict, book_title: str, output_path: str):
    html = build_board_html(year, month, day_map, book_title)
    html_to_png(html, output_path, width=CANVAS_W, height=CANVAS_H)


def build_stats_html(book_title: str, record_year: int, total_km: float, fun_stats: dict) -> str:
    earth_laps = fun_stats.get("earth_laps", 0)
    everest = fun_stats.get("everest_count", 0)
    steps = int(total_km * 1000 / 0.75)

    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:978px;height:845px;background:#1B2A4A;font-family:'Noto Sans KR',sans-serif;
  padding:60px 56px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;}}
.eyebrow{{font-size:12px;color:rgba(255,255,255,0.3);letter-spacing:4px;margin-bottom:14px;}}
.title{{font-size:44px;font-weight:700;color:#fff;line-height:1.1;margin-bottom:6px;}}
.title em{{color:#E8632A;font-style:normal;}}
.sub{{font-size:13px;color:rgba(255,255,255,0.3);margin-bottom:48px;font-weight:300;}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:16px;}}
.card{{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  border-radius:12px;padding:24px 20px;}}
.icon{{font-size:32px;margin-bottom:10px;}}
.val{{font-size:32px;font-weight:700;color:#fff;margin-bottom:3px;line-height:1;}}
.val em{{color:#E8632A;font-style:normal;font-size:18px;}}
.lbl{{font-size:12px;color:rgba(255,255,255,0.4);}}
.note{{font-size:10px;color:rgba(255,255,255,0.2);margin-top:6px;}}
.total{{background:rgba(232,99,42,0.12);border:1px solid rgba(232,99,42,0.25);
  border-radius:12px;padding:20px 24px;margin-top:16px;display:flex;align-items:center;gap:20px;}}
.total-km{{font-size:42px;font-weight:700;color:#E8632A;}}
.total-unit{{font-size:18px;color:rgba(255,255,255,0.4);}}
.total-desc{{font-size:13px;color:rgba(255,255,255,0.4);font-weight:300;line-height:1.7;}}
</style></head>
<body>
<div class="eyebrow">{record_year} RUNNING JOURNAL</div>
<div class="title">나의 <em>러닝</em><br />기록 요약</div>
<div class="sub">{book_title}</div>
<div class="grid">
  <div class="card">
    <div class="icon">🌍</div>
    <div class="val">{earth_laps}<em> 바퀴</em></div>
    <div class="lbl">지구를 돈 횟수</div>
    <div class="note">지구 둘레 40,075km 기준</div>
  </div>
  <div class="card">
    <div class="icon">⛰️</div>
    <div class="val">{everest}<em> 회</em></div>
    <div class="lbl">에베레스트 정복</div>
    <div class="note">에베레스트 8.849km 기준</div>
  </div>
  <div class="card">
    <div class="icon">👟</div>
    <div class="val">{steps:,}<em> 보</em></div>
    <div class="lbl">총 걸음 수</div>
    <div class="note">평균 보폭 75cm 기준</div>
  </div>
  <div class="card">
    <div class="icon">🏃</div>
    <div class="val">{round(total_km,1)}<em> km</em></div>
    <div class="lbl">총 달린 거리</div>
    <div class="note">{record_year}년 한 해 동안</div>
  </div>
</div>
<div class="total">
  <div>
    <div class="total-km">{round(total_km,1)}</div>
    <div class="total-unit">km</div>
  </div>
  <div class="total-desc">
    {record_year}년 한 해 동안<br/>
    총 <strong style="color:#E8632A">{round(total_km,1)}km</strong>를 달렸습니다.<br/>
    정말 대단해요! 🎉
  </div>
</div>
</body></html>"""


def render_stats_page(book_title: str, record_year: int, total_km: float, fun_stats: dict, output_path: str):
    html = build_stats_html(book_title, record_year, total_km, fun_stats)
    html_to_png(html, output_path, width=978, height=845)


def render_cover_page(book_title: str, record_year: int, total_km: float, output_path: str):
    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:1200px;height:1600px;background:#1B2A4A;font-family:'Noto Sans KR',sans-serif;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  position:relative;overflow:hidden;}}
.stripe{{position:absolute;left:0;top:0;bottom:0;width:12px;background:#E8632A;}}
.dots{{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px);
  background-size:24px 24px;}}
.content{{text-align:center;padding:60px;position:relative;z-index:1;}}
.year{{font-size:18px;color:rgba(255,255,255,0.3);letter-spacing:6px;margin-bottom:32px;}}
h1{{font-size:84px;font-weight:700;color:#fff;line-height:1.1;margin-bottom:20px;}}
h1 em{{color:#E8632A;font-style:normal;}}
.stat{{font-size:18px;color:rgba(255,255,255,0.5);font-weight:300;line-height:2.2;}}
.stat strong{{color:#E8632A;font-size:26px;font-weight:700;}}
.deco{{position:absolute;bottom:48px;right:48px;font-size:12px;color:rgba(255,255,255,0.12);
  letter-spacing:3px;z-index:1;}}
</style></head>
<body>
<div class="stripe"></div>
<div class="dots"></div>
<div class="content">
  <div class="year">{record_year}</div>
  <h1>나의<br/><em>러닝</em><br/>일지</h1>
  <div class="stat">
    총 <strong>{round(total_km,1)}km</strong> 달렸어요<br/>
    지구를 <strong>{round(total_km/40075,2)}</strong>바퀴 돌았어요
  </div>
</div>
<div class="deco">MY RUNNING JOURNAL</div>
</body></html>"""
    html_to_png(html, output_path, width=1200, height=1600)


def build_appendix_html(awards: list, book_title: str) -> str:
    awards_html = ""
    medals = ["🥇", "🥈", "🥉", "🏅", "🏅", "🏅"]
    for i, a in enumerate(awards[:6]):
        medal = medals[i] if i < len(medals) else "🏅"
        awards_html += f"""
        <div class="award-item">
          <div class="award-medal">{medal}</div>
          <div class="award-info">
            <div class="award-name">{a.get('name', '')}</div>
            <div class="award-result">{a.get('result', '')}</div>
          </div>
        </div>"""

    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:978px;height:845px;background:#1B2A4A;font-family:'Noto Sans KR',sans-serif;
  padding:60px 56px;overflow:hidden;}}
.eyebrow{{font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:4px;margin-bottom:14px;}}
.title{{font-size:40px;font-weight:700;color:#fff;margin-bottom:6px;}}
.title em{{color:#E8632A;font-style:normal;}}
.sub{{font-size:13px;color:rgba(255,255,255,0.3);margin-bottom:40px;font-weight:300;}}
.divider{{width:40px;height:3px;background:#E8632A;margin-bottom:32px;}}
.award-item{{display:flex;align-items:center;gap:20px;
  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
  border-radius:10px;padding:20px 24px;margin-bottom:14px;}}
.award-medal{{font-size:36px;}}
.award-name{{font-size:16px;font-weight:500;color:#fff;margin-bottom:4px;}}
.award-result{{font-size:13px;color:rgba(255,255,255,0.5);font-weight:300;}}
</style></head>
<body>
<div class="eyebrow">APPENDIX</div>
<div class="title">수상 <em>경력</em></div>
<div class="sub">{book_title}</div>
<div class="divider"></div>
{awards_html}
</body></html>"""


def render_appendix_page(awards: list, book_title: str, output_path: str):
    html = build_appendix_html(awards, book_title)
    html_to_png(html, output_path, width=978, height=845)