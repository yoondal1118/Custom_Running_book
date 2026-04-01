import { useEffect, useRef } from 'react'
import './Hero.css'

function BookCover() {
  const boardRef = useRef(null)
  const runDays = [1,3,4,6,8,10,11,13,15,17,19,20,22,24,25,27,29,30]

  useEffect(() => {
    if (!boardRef.current) return
    boardRef.current.innerHTML = ''
    for (let i = 1; i <= 31; i++) {
      const cell = document.createElement('div')
      const isActive = runDays.includes(i)
      const isHighlight = i === 15
      cell.className = `board-cell-mini${isActive ? ' active' : ''}${isHighlight ? ' highlight' : ''}`
      cell.textContent = i
      boardRef.current.appendChild(cell)
    }
  }, [])

  return (
    <div className="book-3d">
      <div className="book-spine"><div className="book-spine-text">나의 러닝일지 2024</div></div>
      <div className="book-cover">
        <div className="book-cover-stripe" />
        <div className="book-cover-inner">
          <div className="book-cover-title">나의<br /><em>러닝</em><br />일지</div>
          <div className="book-cover-subtitle">My Running Journal</div>
          <div className="book-board-preview">
            <div className="board-grid-mini" ref={boardRef} />
          </div>
          <div className="book-cover-badge">2024<br />EDITION</div>
        </div>
      </div>
    </div>
  )
}

export default function Hero({ onOrderClick }) {
  return (
    <section className="hero">
      <div className="hero-text">
        <div className="section-label" style={{ color: 'var(--orange)' }}>나만의 보드판 러닝 기록북</div>
        <h1>나의<br /><em>러닝일지</em></h1>
        <p className="hero-subtitle">
          하루하루 달린 기록이 모여 보드판이 되고, 한 권의 책이 됩니다.<br />
          날짜별 페이스·거리를 입력하면, 지구를 몇 바퀴 돌았는지까지 계산해 드려요.
        </p>
        <div className="hero-price-block">
          <div className="hero-price"><sup>₩</sup>39,000</div>
          <div className="hero-price-note">배송비 포함 · 약 2주 제작</div>
        </div>
        <button className="btn-primary" onClick={onOrderClick}>주문하기</button>
        <button
          className="btn-secondary"
          onClick={() => document.getElementById('pages')?.scrollIntoView({ behavior: 'smooth' })}
        >책 미리보기</button>
      </div>
      <div className="hero-visual">
        <BookCover />
      </div>
    </section>
  )
}
