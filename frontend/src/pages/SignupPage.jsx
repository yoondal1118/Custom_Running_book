import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

function Field({ label, name, type = 'text', placeholder, required, value, onChange }) {
  return (
    <div className="auth-field">
      <label>{label}{required && <span className="required"> *</span>}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(name, e.target.value)}
      />
    </div>
  )
}

export default function SignupPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', name: '', email: '',
    password: '', password_confirm: '',
    address: '', address_detail: '', postal_code: '', phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.username || !form.name || !form.email || !form.password) {
      setError('필수 항목을 모두 입력해주세요')
      return
    }
    if (form.password !== form.password_confirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      login(data.data.token, data.data.user)
      navigate('/')
    } catch (e) {
      setError(e.message || '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box wide">
        <Link to="/" className="auth-logo">러닝일지<span>북</span></Link>
        <h2>회원가입</h2>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-section-title">기본 정보</div>
        <div className="auth-row">
          <Field label="아이디" name="username" placeholder="영문/숫자" required value={form.username} onChange={update} />
          <Field label="이름" name="name" placeholder="실명 입력" required value={form.name} onChange={update} />
        </div>
        <Field label="이메일" name="email" type="email" placeholder="example@email.com" required value={form.email} onChange={update} />
        <div className="auth-row">
          <Field label="비밀번호" name="password" type="password" placeholder="8자 이상" required value={form.password} onChange={update} />
          <Field label="비밀번호 확인" name="password_confirm" type="password" placeholder="비밀번호 재입력" required value={form.password_confirm} onChange={update} />
        </div>
        <Field label="연락처" name="phone" placeholder="010-0000-0000" value={form.phone} onChange={update} />

        <div className="auth-section-title">
          배송지 등록
          <span style={{ fontWeight: 300, fontSize: 12, color: '#888', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
            (선택 — 마이페이지에서도 등록 가능)
          </span>
        </div>
        <Field label="우편번호" name="postal_code" placeholder="00000" value={form.postal_code} onChange={update} />
        <Field label="주소" name="address" placeholder="도로명 주소" value={form.address} onChange={update} />
        <Field label="상세주소" name="address_detail" placeholder="동/호수" value={form.address_detail} onChange={update} />

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '가입 중...' : '회원가입 완료'}
        </button>

        <p className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}