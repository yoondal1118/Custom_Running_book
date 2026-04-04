import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './MyPage.css'

export default function MyPage() {
  const { user, authFetch, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('orders')

  // 주문 내역
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // 주문 취소 모달
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  // 배송지 변경 모달
  const [shippingModal, setShippingModal] = useState(null)
  const [shippingForm, setShippingForm] = useState({
    recipientName: '', recipientPhone: '', postalCode: '',
    address1: '', address2: '', shippingMemo: ''
  })
  const [shippingMsg, setShippingMsg] = useState('')

  // 내 정보 변경
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

  // 주문 취소
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

  // 배송지 변경 모달 열기
  const handleShippingOpen = (o) => {
    setShippingForm({
      recipientName:  user?.name || '',
      recipientPhone: user?.phone || '',
      postalCode:     user?.postal_code || '',
      address1:       user?.address || '',
      address2:       user?.address_detail || '',
      shippingMemo:   ''
    })
    setShippingMsg('')
    setShippingModal(o.id)
  }

  // 배송지 변경 제출
  const handleShippingSubmit = async () => {
    try {
      const res = await authFetch(`/api/orders/${shippingModal}/shipping`, {
        method: 'PATCH',
        body: JSON.stringify(shippingForm)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      setShippingMsg('배송지가 변경되었습니다')
      setTimeout(() => setShippingModal(null), 1200)
    } catch (e) {
      setShippingMsg(`오류: ${e.message}`)
    }
  }

  // 내 정보 저장
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
      const data = await res.json()
      if (!data.success) {
        setInfoError(`저장 실패: ${data.detail || JSON.stringify(data)}`)
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

  const SHIPPING_FIELDS = [
    { label: '수령인',    key: 'recipientName',  placeholder: '홍길동' },
    { label: '연락처',    key: 'recipientPhone', placeholder: '010-0000-0000' },
    { label: '우편번호',  key: 'postalCode',     placeholder: '00000' },
    { label: '주소',      key: 'address1',       placeholder: '도로명 주소' },
    { label: '상세주소',  key: 'address2',       placeholder: '동/호수' },
    { label: '배송 메모', key: 'shippingMemo',   placeholder: '부재시 경비실' },
  ]

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

        {/* 주문 내역 */}
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
                      <div><span>결제 금액</span>{o.total_price?.toLocaleString()}원</div>
                      <div><span>주문일</span>{o.ordered_at}</div>
                      <div><span>예상 배송일</span>{o.estimated_delivery}</div>
                      {o.cancel_reason && <div><span>취소 사유</span>{o.cancel_reason}</div>}
                    </div>
                    {o.status !== 'cancelled' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="shipping-btn" onClick={() => handleShippingOpen(o)}>
                          배송지 변경
                        </button>
                        <button className="cancel-btn" onClick={() => { setCancelModal(o.id); setCancelReason('') }}>
                          주문 취소
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 내 정보 변경 */}
        {tab === 'info' && (
          <div>
            <h2>내 정보 변경</h2>
            {infoMsg && <div className="info-success">{infoMsg}</div>}
            {infoError && <div className="info-error">{infoError}</div>}

            <div className="info-section">계정 정보</div>
            <div className="info-field">
              <label>이메일</label>
              <input value={infoForm.email} onChange={e => setInfoForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="info-row">
              <div className="info-field">
                <label>새 비밀번호</label>
                <input type="password" placeholder="변경 시에만 입력"
                  value={infoForm.password} onChange={e => setInfoForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="info-field">
                <label>비밀번호 확인</label>
                <input type="password"
                  value={infoForm.password_confirm} onChange={e => setInfoForm(p => ({ ...p, password_confirm: e.target.value }))} />
              </div>
            </div>
            <div className="info-field">
              <label>연락처</label>
              <input value={infoForm.phone} onChange={e => setInfoForm(p => ({ ...p, phone: e.target.value }))} />
            </div>

            <div className="info-section">배송지</div>
            <div className="info-field">
              <label>우편번호</label>
              <input value={infoForm.postal_code} onChange={e => setInfoForm(p => ({ ...p, postal_code: e.target.value }))} />
            </div>
            <div className="info-field">
              <label>주소</label>
              <input value={infoForm.address} onChange={e => setInfoForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="info-field">
              <label>상세주소</label>
              <input value={infoForm.address_detail} onChange={e => setInfoForm(p => ({ ...p, address_detail: e.target.value }))} />
            </div>

            <button className="info-save-btn" onClick={handleInfoSave}>저장하기</button>
          </div>
        )}
      </div>

      {/* 주문 취소 모달 */}
      {cancelModal && (
        <div className="cancel-overlay" onClick={e => e.target === e.currentTarget && setCancelModal(null)}>
          <div className="cancel-modal">
            <h3>주문 취소</h3>
            <p>취소 사유를 입력해주세요</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="취소 사유 입력..."
              rows={4}
            />
            <div className="cancel-modal-btns">
              <button className="cancel-modal-back" onClick={() => setCancelModal(null)}>돌아가기</button>
              <button className="cancel-modal-confirm" onClick={handleCancelSubmit}>취소 확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 배송지 변경 모달 */}
      {shippingModal && (
        <div className="cancel-overlay" onClick={e => e.target === e.currentTarget && setShippingModal(null)}>
          <div className="cancel-modal">
            <h3>배송지 변경</h3>
            <p>PAID 상태일 때만 변경 가능합니다</p>
            {SHIPPING_FIELDS.map(f => (
              <div key={f.key} className="info-field" style={{ marginBottom: 10 }}>
                <label>{f.label}</label>
                <input
                  value={shippingForm[f.key]}
                  placeholder={f.placeholder}
                  onChange={e => setShippingForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', padding: '9px 12px',
                    fontFamily: 'Noto Sans KR', fontSize: 13,
                    outline: 'none', width: '100%'
                  }}
                />
              </div>
            ))}
            {shippingMsg && (
              <div className={shippingMsg.startsWith('오류') ? 'info-error' : 'info-success'}
                style={{ marginBottom: 12 }}>
                {shippingMsg}
              </div>
            )}
            <div className="cancel-modal-btns">
              <button className="cancel-modal-back" onClick={() => setShippingModal(null)}>닫기</button>
              <button className="cancel-modal-confirm"
                style={{ background: 'var(--orange)' }}
                onClick={handleShippingSubmit}>
                변경 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}