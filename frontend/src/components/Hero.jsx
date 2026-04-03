import './Hero.css'

function BookCover() {
  return (
    <div className="book-3d">
      <div className="book-cover">
        <div className="book-cover-stripe" />
        <div className="book-cover-inner">
          <div className="book-cover-tag">MY RUNNING JOURNAL</div>
          <div className="book-cover-title">나의<br /><em>하나밖에</em><br />없는<br />러닝일지</div>
          <div className="book-cover-bottom">
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero({ onOrderClick }) {
  return (
    <section className="hero">
      <div className="hero-text">
        <div className="section-label" style={{ color: 'var(--orange)' }}>나만의 보드게임판 러닝 기록북</div>
        <h1>나의<br /><em>러닝일지</em></h1>
        <p className="hero-subtitle">
          하루하루 달린 기록이 모여 보드게임판이 되고,<br />
          세상에 하나밖에 없는 나만의 책이 됩니다.
        </p>
        <div className="hero-price-block">
          <div className="hero-price"><sup>₩</sup>12,000</div>
          <div className="hero-price-note">배송비 포함 · 부록 추가 시 +3,000원</div>
        </div>
        <button className="btn-primary" onClick={onOrderClick}>주문하기</button>
        <button
          className="btn-secondary"
          onClick={() => document.getElementById('pages')?.scrollIntoView({ behavior: 'smooth' })}
        >책 소개 보기</button>
      </div>
      <div className="hero-visual">
        <BookCover />
      </div>
    </section>
  )
}