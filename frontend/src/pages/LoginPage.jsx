import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError('아이디와 비밀번호를 입력해주세요')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      login(data.data.token, data.data.user)
      navigate('/')
    } catch (e) {
      setError(e.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <Link to="/" className="auth-logo">러닝일지<span>북</span></Link>
        <h2>로그인</h2>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label>아이디</label>
          <input
            type="text" placeholder="아이디 입력"
            value={form.username} onChange={e => update('username', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div className="auth-field">
          <label>비밀번호</label>
          <input
            type="password" placeholder="비밀번호 입력"
            value={form.password} onChange={e => update('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <p className="auth-link">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
