import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar({ onOrderClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleOrderClick = () => {
    if (!user) {
      alert('주문하려면 로그인이 필요합니다')
      navigate('/login')
      return
    }
    onOrderClick()
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">러닝일지<span>북</span></Link>
      <div className="navbar-links">
        <button onClick={() => scrollTo('pages')}>책 소개</button>
        <button onClick={handleOrderClick}>주문하기</button>
        <button onClick={() => scrollTo('price')}>가격</button>
        {user ? (
          <>
            <Link to="/mypage" className="navbar-mypage">마이페이지</Link>
            <button className="navbar-logout" onClick={() => { logout(); navigate('/') }}>로그아웃</button>
          </>
        ) : (
          <Link to="/login" className="navbar-login">로그인</Link>
        )}
      </div>
    </nav>
  )
}
