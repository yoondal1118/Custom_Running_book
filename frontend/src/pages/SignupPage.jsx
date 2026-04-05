import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AuthPage.css'

function Field({ label, name, type='text', placeholder, required, value, onChange }) {
  return (
    <div className="auth-field">
      <label>{label}{required && <span className="required"> *</span>}</label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(name, e.target.value)}/>
    </div>
  )
}

export default function SignupPage() {
  const navigate  = useNavigate()
  const [form, setForm] = useState({
    username: '', name: '', email: '',
    password: '', password_confirm: '', phone: '',
    recipient_name: '', recipient_phone: '', postal_code: '', address1: '', address2: '',
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.username || !form.name || !form.email || !form.password || !form.phone) {
      setError('필수 항목을 모두 입력해주세요'); return
    }
    if (!usernameRegex.test(form.username)) {
      setError('아이디는 6자 이상이며 영문과 숫자를 포함해야 합니다');
      return;
    }
    if (!emailRegex.test(form.email)) {
      setError('올바른 이메일 형식을 입력해주세요');
      return;
    }
    if (!passwordRegex.test(form.password)) {
      setError('비밀번호는 8~20자이며 영문과 숫자를 포함해야 합니다');
      return;
    }
    if (form.password !== form.password_confirm) {
      setError('비밀번호가 일치하지 않습니다'); return
    }
    if (!phoneRegex.test(form.phone)) {
      setError('전화번호는 "-"를 포함해주세요');
      return;
    }
    if (loading) return;
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      navigate('/login')
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
          <Field label="아이디" name="username" placeholder="영문 및 숫자 포함 6자 이상" maxLength={20} required value={form.username} onChange={update}/>
          <Field label="이름"   name="name"     placeholder="실명 입력" required value={form.name}     onChange={update}/>
        </div>
        <Field label="이메일" name="email" type="email" placeholder="example@email.com" required value={form.email} onChange={update}/>
        <div className="auth-row">
          <Field label="비밀번호"    name="password"         type="password" placeholder="영문 및 숫자 포함 8자 이상"  maxLength={20}  required value={form.password}         onChange={update}/>
          <Field label="비밀번호 확인" name="password_confirm" type="password" placeholder="비밀번호 재입력" required maxLength={20} value={form.password_confirm} onChange={update}/>
        </div>
        <Field label="연락처" name="phone" placeholder="010-0000-0000" required value={form.phone} onChange={update}/>

        <div className="auth-section-title">
          기본 배송지 등록
          <span style={{fontWeight:300,fontSize:12,color:'#888',marginLeft:8,textTransform:'none',letterSpacing:0}}>
            (선택 — 마이페이지에서도 등록 가능)
          </span>
        </div>
        <div className="auth-row">
          <Field label="수령인"  name="recipient_name"  placeholder="홍길동"       value={form.recipient_name}  onChange={update}/>
          <Field label="연락처"  name="recipient_phone" placeholder="010-0000-0000" value={form.recipient_phone} onChange={update}/>
        </div>
        <Field label="우편번호" name="postal_code" placeholder="00000"    value={form.postal_code} onChange={update}/>
        <Field label="주소"     name="address1"    placeholder="도로명 주소" value={form.address1}    onChange={update}/>
        <Field label="상세주소" name="address2"    placeholder="동/호수"    value={form.address2}    onChange={update}/>

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '가입 중...' : '회원가입 완료'}
        </button>
        <p className="auth-link">이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
      </div>
    </div>
  )
}