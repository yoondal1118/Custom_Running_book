import './PagePreviews.css'

function MiniCover() {
  return (
    <div className="mini-cover">
      <div className="mini-cover-stripe" />
      <div className="mini-cover-tag">MY RUNNING JOURNAL</div>
      <div className="mini-cover-title">나의<br /><em>하나밖에</em><br />없는<br />러닝일지</div>
      <div className="mini-cover-year">2024</div>
    </div>
  )
}

function MiniStats() {
  return (
    <div className="mini-stats">
      {[
        { icon: '🌍', val: '2.3회', label: '지구 둘레' },
        { icon: '⛰️', val: '10.7회', label: '에베레스트 정복' },
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
  const runDays = { 3: {km:3,g:'bronze'}, 8: {km:8,g:'silver'}, 12: {km:12,g:'silver'}, 17: {km:20,g:'gold'}, 20: {km:4,g:'bronze'}, 27: {km:15,g:'gold'} }
  const colors = { gold:'#F5C518', silver:'#C0C0C8', bronze:'#CD7F32', none:'rgba(30,79,163,0.08)' }
  const borders = { gold:'#B8940C', silver:'#888898', bronze:'#8B5A1A', none:'#C5DAFF' }

  return (
    <div className="mini-board-game">
      <div className="mini-board-header">
        <span className="mini-board-title">2024년 3월</span>
        <span className="mini-board-total">총 62km</span>
      </div>
      <div className="mini-board-grid">
        <div className="mini-bc start">S</div>
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
          const r = runDays[d]
          const g = r ? r.g : 'none'
          return (
            <div key={d} className="mini-bc"
              style={{ background: colors[g], border: `1px solid ${borders[g]}`, color: r ? borders[g] : '#aaa' }}>
              {r ? `${r.km}` : d}
            </div>
          )
        })}
      </div>
      <div className="mini-board-legend">
        <span style={{color:'#CD7F32'}}>● 동</span>
        <span style={{color:'#C0C0C8'}}>● 은</span>
        <span style={{color:'#F5C518'}}>● 금</span>
      </div>
    </div>
  )
}

function MiniAppendix() {
  return (
    <div className="mini-appendix">
      <div className="mini-append-item">🏆 서울 마라톤 2024 — 완주</div>
      <div className="mini-append-item">🥇 경주 하프 — 1위 입상</div>
      <div style={{ display:'flex', gap:4, marginTop:8 }}>
        {['사진','사진','사진'].map((t,i) => (
          <div key={i} className="mini-photo">{t}</div>
        ))}
      </div>
    </div>
  )
}

const pages = [
  {
    num: '01', title: '표지', bg: 'cover-bg',
    desc: '보드판 미리보기와 함께 이름, 기간이 인쇄되는 나만의 커스텀 표지',
    preview: <MiniCover />
  },
  {
    num: '02', title: '첫 페이지 — 총 기록', bg: 'first-bg',
    desc: '누적 km로 지구 몇 바퀴, 에베레스트 몇 번 정복인지 자동 계산',
    preview: <MiniStats />
  },
  {
    num: '03', title: '월별 보드게임판', bg: 'monthly-bg',
    desc: '뱀처럼 이어지는 보드게임판. 달린 날은 금·은·동으로 색칠되고 km·페이스가 표시됨',
    preview: <MiniBoard />
  },
  {
    num: '04', title: '부록 — 수상', bg: 'appendix-bg',
    desc: '마라톤 수상 경력을 담은 기념 부록 (+3,000원)',
    preview: <MiniAppendix />
  },
]

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