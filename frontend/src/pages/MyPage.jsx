import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './MyPage.css'

export default function MyPage() {
  const { user, authFetch, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [infoForm, setInfoForm] = useState({
    email: '', password: '', password_confirm: '',
    address: '', address_detail: '', postal_code: '', phone: ''
  })
  const [infoMsg, setInfoMsg] = useState('')
  const [infoError, setInfoError] = useState('')

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await authFetch('/api/orders/my')
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setOrdersLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setInfoForm({
      email: user.email || '',
      password: '', password_confirm: '',
      address: user.address || '',
      address_detail: user.address_detail || '',
      postal_code: user.postal_code || '',
      phone: user.phone || '',
    })
    fetchOrders()
  }, [user])

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) { alert('취소 사유를 입력해주세요'); return }
    try {
      const res = await authFetch(`/api/orders/${cancelModal}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancelReason })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      setCancelModal(null)
      setCancelReason('')
      fetchOrders()
    } catch (e) {
      alert(e.message || '취소 중 오류가 발생했습니다')
    }
  }

  const handleInfoSave = async () => {
    setInfoMsg('')
    setInfoError('')
    if (infoForm.password && infoForm.password !== infoForm.password_confirm) {
      setInfoError('비밀번호가 일치하지 않습니다')
      return
    }
    try {
      const body = {
        email: infoForm.email,
        address: infoForm.address,
        address_detail: infoForm.address_detail,
        postal_code: infoForm.postal_code,
        phone: infoForm.phone,
      }
      if (infoForm.password) {
        body.password = infoForm.password
        body.password_confirm = infoForm.password_confirm
      }

      const res = await authFetch('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(body)
      })

      // 401이어도 로그인으로 보내지 않고 에러 표시 — 원인 파악 우선
      const data = await res.json()
      console.log('PATCH /api/auth/me 응답:', res.status, data)

      if (!data.success) {
        setInfoError(`저장 실패 (${res.status}): ${data.detail || JSON.stringify(data)}`)
        return
      }
      setUser(data.data)
      setInfoMsg('정보가 저장되었습니다')
      setInfoForm(p => ({ ...p, password: '', password_confirm: '' }))
    } catch (e) {
      setInfoError('저장 중 오류: ' + e.message)
    }
  }

  const statusLabel = (s) => s === 'cancelled' ? '취소됨' : '결제완료'

  if (!user) return null

  return (
    <div className="mypage">
      <div className="mypage-sidebar">
        <Link to="/" className="mypage-logo">러닝일지<span>북</span></Link>
        <div className="mypage-username">{user.name}님</div>
        <nav className="mypage-nav">
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>주문 내역</button>
          <button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>내 정보 변경</button>
        </nav>
        <button className="mypage-logout" onClick={() => { logout(); navigate('/') }}>로그아웃</button>
      </div>

      <div className="mypage-content">
        {tab === 'orders' && (
          <div>
            <h2>주문 내역</h2>
            {ordersLoading ? (
              <p className="mypage-empty">불러오는 중...</p>
            ) : orders.length === 0 ? (
              <p className="mypage-empty">주문 내역이 없습니다</p>
            ) : (
              <div className="order-list">
                {orders.map(o => (
                  <div key={o.id} className={`order-card${o.status === 'cancelled' ? ' cancelled' : ''}`}>
                    <div className="order-card-header">
                      <div className="order-card-title">{o.book_title}</div>
                      <div className={`order-status ${o.status}`}>{statusLabel(o.status)}</div>
                    </div>
                    <div className="order-card-info">
                      <div><span>주문번호</span>{o.book_uid}</div>
                      <div><span>기록 연도</span>{o.record_year}년</div>
                      <div><span>기록 월수</span>{o.month_count}개월</div>
                      <div><span>결제 금액</span>{o.total_price?.toLocaleString()}원</div>
                      <div><span>주문일</span>{o.ordered_at}</div>
                      <div><span>예상 배송일</span>{o.estimated_delivery}</div>
                      {o.cancel_reason && <div><span>취소 사유</span>{o.cancel_reason}</div>}
                    </div>
                    {o.status !== 'cancelled' && (
                      <button className="cancel-btn" onClick={() => { setCancelModal(o.id); setCancelReason('') }}>
                        주문 취소
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'info' && (
          <div>
            <h2>내 정보 변경</h2>
            {infoMsg && <div className="info-success">{infoMsg}</div>}
            {infoError && <div className="info-error">{infoError}</div>}
            <div className="info-section">계정 정보</div>
            <div className="info-field"><label>이메일</label>
              <input value={infoForm.email} onChange={e => setInfoForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="info-row">
              <div className="info-field"><label>새 비밀번호</label>
                <input type="password" placeholder="변경 시에만 입력" value={infoForm.password} onChange={e => setInfoForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="info-field"><label>비밀번호 확인</label>
                <input type="password" value={infoForm.password_confirm} onChange={e => setInfoForm(p => ({ ...p, password_confirm: e.target.value }))} />
              </div>
            </div>
            <div className="info-field"><label>연락처</label>
              <input value={infoForm.phone} onChange={e => setInfoForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="info-section">배송지</div>
            <div className="info-field"><label>우편번호</label>
              <input value={infoForm.postal_code} onChange={e => setInfoForm(p => ({ ...p, postal_code: e.target.value }))} />
            </div>
            <div className="info-field"><label>주소</label>
              <input value={infoForm.address} onChange={e => setInfoForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="info-field"><label>상세주소</label>
              <input value={infoForm.address_detail} onChange={e => setInfoForm(p => ({ ...p, address_detail: e.target.value }))} />
            </div>
            <button className="info-save-btn" onClick={handleInfoSave}>저장하기</button>
          </div>
        )}
      </div>

      {cancelModal && (
        <div className="cancel-overlay" onClick={e => e.target === e.currentTarget && setCancelModal(null)}>
          <div className="cancel-modal">
            <h3>주문 취소</h3>
            <p>취소 사유를 입력해주세요</p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="취소 사유 입력..." rows={4} />
            <div className="cancel-modal-btns">
              <button className="cancel-modal-back" onClick={() => setCancelModal(null)}>돌아가기</button>
              <button className="cancel-modal-confirm" onClick={handleCancelSubmit}>취소 확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}