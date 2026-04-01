import './PagePreviews.css'

const pages = [
  {
    num: '01', title: '표지', bg: 'cover-bg',
    desc: '보드판 미리보기와 함께 이름, 기간이 인쇄되는 나만의 커스텀 표지',
    preview: <MiniCover />
  },
  {
    num: '02', title: '첫 페이지 — 총 기록', bg: 'first-bg',
    desc: '누적 km로 지구 몇 바퀴, 에베레스트 몇 번 정상 정복인지 자동 계산',
    preview: <MiniStats />
  },
  {
    num: '03', title: '월별 보드판', bg: 'monthly-bg',
    desc: '해당 월의 일 수에 맞춘 보드판. 달린 날은 km·페이스 표시, 말이 랜덤 배치됨',
    preview: <MiniBoard />
  },
  {
    num: '04', title: '부록 — 수상 & 사진', bg: 'appendix-bg',
    desc: '마라톤 수상 경력, 특별한 러닝 사진을 담은 기념 부록 페이지',
    preview: <MiniAppendix />
  },
]

function MiniCover() {
  return (
    <div className="mini-cover">
      <div className="mini-cover-stripe" />
      <div className="mini-cover-title">나의<br />러닝<br />일지</div>
    </div>
  )
}

function MiniStats() {
  return (
    <div className="mini-stats">
      {[
        { icon: '🌍', val: '2.3회', label: '지구 둘레' },
        { icon: '⛰', val: '10.7회', label: '에베레스트 정복' },
        { icon: '🏃', val: '937 km', label: '총 거리' },
      ].map(s => (
        <div key={s.label} className="mini-stat-row">
          <div className="mini-stat-icon">{s.icon}</div>
          <div>
            <div className="mini-stat-val">{s.val}</div>
            <div className="mini-stat-label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniBoard() {
  const runDays = [2,4,5,7,9,11,14,16,18,20,21,23,25,27,28]
  return (
    <div className="mini-board">
      <div className="mini-board-title">2024년 3월</div>
      <div className="mini-board-grid">
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
          <div
            key={d}
            className={`mini-board-cell${runDays.includes(d) ? ' run' : ''}${d === 20 ? ' piece' : ''}`}
          >{d}</div>
        ))}
      </div>
    </div>
  )
}

function MiniAppendix() {
  return (
    <div className="mini-appendix">
      <div className="mini-append-item">🏆 서울 마라톤 2024 — 완주</div>
      <div className="mini-append-item">🥇 경주 하프 — 1위 입상</div>
      <div className="mini-photos">
        {['사진', '사진', '사진'].map((t, i) => <div key={i} className="mini-photo">{t}</div>)}
      </div>
    </div>
  )
}

export default function PagePreviews() {
  return (
    <section className="pages-section" id="pages">
      <div className="section-label">책 구성</div>
      <h2>총 4가지 페이지로<br />구성된 나만의 기록북</h2>
      <div className="pages-grid">
        {pages.map(p => (
          <div key={p.num} className="page-card">
            <div className={`page-card-preview ${p.bg}`}>
              {p.preview}
            </div>
            <div className="page-card-info">
              <div className="page-card-num">Page {p.num}</div>
              <div className="page-card-title">{p.title}</div>
              <div className="page-card-desc">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
