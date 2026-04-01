import './Navbar.css'

export default function Navbar({ onOrderClick }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo">러닝일지<span>북</span></div>
      <div className="navbar-links">
        <button onClick={() => scrollTo('pages')}>책 소개</button>
        <button onClick={onOrderClick}>주문하기</button>
        <button onClick={() => scrollTo('price')}>가격</button>
      </div>
    </nav>
  )
}
