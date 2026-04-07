import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AddressModal from '../components/AddressModal'
import './MyPage.css'

export default function MyPage() {
  const { user, authFetch, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('orders')

  // 주문 내역
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // 주문 취소
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  // 배송지 변경 (주문별)
  const [shippingOrderId, setShippingOrderId] = useState(null)
  const [shippingAddrModalOpen, setShippingAddrModalOpen] = useState(false)

  // 내 정보
  const [infoForm, setInfoForm] = useState({ email:'', password:'', password_confirm:'', phone:'' })
  const [infoMsg, setInfoMsg]   = useState('')
  const [infoError, setInfoError] = useState('')

  // 비밀번호 확인 모달
  const [passwordModal, setPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [passwordVerifying, setPasswordVerifying] = useState(false)

  // 기본 배송지 관리
  const [addrModalOpen, setAddrModalOpen] = useState(false)

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res  = await authFetch('/api/orders/my')
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } catch (e) { console.error(e) }
    finally { setOrdersLoading(false) }
  }, [authFetch])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setInfoForm({ email: user.email||'', password:'', password_confirm:'', phone: user.phone||'' })
    fetchOrders()
  }, [user])

  // 주문 취소
  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) { alert('취소 사유를 입력해주세요'); return }
    try {
      const res  = await authFetch(`/api/orders/${cancelModal}/cancel`, {
        method: 'POST', body: JSON.stringify({ cancelReason })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      alert("주문이 취소되었습니다")
      setCancelModal(null); setCancelReason(''); fetchOrders()
    } catch (e) { alert(e.message || '취소 중 오류') }
  }

  // 주문 배송지 변경
  const handleShippingSelect = async (addr) => {
    try {
      const res  = await authFetch(`/api/orders/${shippingOrderId}/shipping`, {
        method: 'PATCH', body: JSON.stringify({ addressId: addr.id })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      setShippingAddrModalOpen(false)
      setShippingOrderId(null)
      fetchOrders()
      alert('배송지가 변경되었습니다')
    } catch (e) { alert(e.message || '배송지 변경 중 오류') }
  }

  // 내 정보 저장
  const handleInfoSave = async () => {
    setInfoMsg(''); setInfoError('')
    if (infoForm.password && infoForm.password !== infoForm.password_confirm) {
      setInfoError('비밀번호가 일치하지 않습니다'); return
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$~!%*?&])[A-Za-z\d@$~!%*?&]{8,20}$/;
    if (infoForm.password && !passwordRegex.test(infoForm.password)) {
      setInfoError('비밀번호는 영문과 숫자, 특수문자(@$~!%*?&)를 포함하여 8~20자여야 합니다');
      return;
    }
    // 비밀번호 확인 모달 띄우기
    setPasswordModal(true)
    setCurrentPassword('')
  }

  // 비밀번호 확인 후 정보 저장
  const handleConfirmPassword = async () => {
    if (!currentPassword.trim()) {
      setInfoError('현재 비밀번호를 입력해주세요')
      return
    }
    setPasswordVerifying(true)
    try {
      const body = { 
        email: infoForm.email, 
        phone: infoForm.phone,
        current_password: currentPassword
      }
      if (infoForm.password) { 
        body.password = infoForm.password
        body.password_confirm = infoForm.password_confirm 
      }
      const res  = await authFetch('/api/auth/me', { method: 'PATCH', body: JSON.stringify(body) })
      const data = await res.json()
      if (!data.success) { setInfoError(`저장 실패: ${data.detail}`); return }
      setUser(data.data)
      setInfoMsg('정보가 저장되었습니다')
      setInfoForm(p => ({ ...p, password:'', password_confirm:'' }))
      setPasswordModal(false)
      setCurrentPassword('')
    } catch (e) { setInfoError('저장 중 오류: ' + e.message) }
    finally { setPasswordVerifying(false) }
  }

  const statusLabel = s => s === 'cancelled' ? '취소됨' : '결제완료'

  if (!user) return null

  return (
    <div className="mypage">
      <div className="mypage-sidebar">
        <Link to="/" className="mypage-logo">러닝일지<span>북</span></Link>
        <div className="mypage-username">{user.name}님</div>
        <nav className="mypage-nav">
          <button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}>주문 내역</button>
          <button className={tab==='info'?'active':''}   onClick={()=>setTab('info')}>내 정보 변경</button>
        </nav>
        <button className="mypage-logout" onClick={()=>{ logout(); navigate('/') }}>로그아웃</button>
      </div>

      <div className="mypage-content">

        {/* 주문 내역 */}
        {tab === 'orders' && (
          <div>
            <h2>주문 내역</h2>
            {ordersLoading ? <p className="mypage-empty">불러오는 중...</p>
            : orders.length === 0 ? <p className="mypage-empty">주문 내역이 없습니다</p>
            : (
              <div className="order-list">
                {orders.map(o => (
                  <div key={o.id} className={`order-card${o.status==='cancelled'?' cancelled':''}`}>
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
                      {o.address && (
                        <div style={{gridColumn:'1/-1'}}>
                          <span>배송지</span>
                          [{o.address.postal_code}] {o.address.address1} {o.address.address2}
                          &nbsp;({o.address.recipient_name})
                        </div>
                      )}
                      {o.cancel_reason && <div><span>취소 사유</span>{o.cancel_reason}</div>}
                    </div>
                    {o.status !== 'cancelled' && (
                      <div style={{display:'flex', gap:8, marginTop:8}}>
                        <button className="shipping-btn" onClick={()=>{
                          setShippingOrderId(o.id)
                          setShippingAddrModalOpen(true)
                        }}>배송지 변경</button>
                        <button className="cancel-btn" onClick={()=>{ setCancelModal(o.id); setCancelReason('') }}>
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
            {infoMsg   && <div className="info-success">{infoMsg}</div>}
            {infoError && <div className="info-error">{infoError}</div>}

            <div className="info-section">계정 정보</div>
            <div className="info-field"><label>이메일</label>
              <input value={infoForm.email} onChange={e=>setInfoForm(p=>({...p,email:e.target.value}))}/>
            </div>
              <div className="info-field"><label>새 비밀번호</label>
                <input type="password" placeholder="변경 시에만 입력" value={infoForm.password}
                  onChange={e=>setInfoForm(p=>({...p,password:e.target.value}))}/>
              </div>
              <div className="info-field"><label>비밀번호 확인</label>
                <input type="password" value={infoForm.password_confirm}
                  onChange={e=>setInfoForm(p=>({...p,password_confirm:e.target.value}))}/>
            </div>
            <div className="info-field"><label>연락처</label>
              <input value={infoForm.phone} onChange={e=>setInfoForm(p=>({...p,phone:e.target.value}))}/>
            </div>

            <div className="info-section" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>배송지 관리</span>
              <button className="shipping-btn" onClick={()=>setAddrModalOpen(true)}>배송지 추가/변경</button>
            </div>
            {user.default_address ? (
              <div className="order-card" style={{marginBottom:0}}>
                <div className="order-card-info">
                  <div><span>기본 배송지</span>{user.default_address.address1} {user.default_address.address2}</div>
                  <div><span>우편번호</span>{user.default_address.postal_code}</div>
                  <div><span>수령인</span>{user.default_address.recipient_name} · {user.default_address.recipient_phone}</div>
                </div>
              </div>
            ) : (
              <p className="mypage-empty" style={{fontSize:13}}>등록된 배송지가 없습니다</p>
            )}

            <button className="info-save-btn" style={{marginTop:24}} onClick={handleInfoSave}>저장하기</button>
          </div>
        )}
      </div>

      {/* 주문 취소 모달 */}
      {cancelModal && (
        <div className="cancel-overlay" onClick={e=>e.target===e.currentTarget&&setCancelModal(null)}>
          <div className="cancel-modal">
            <h3>주문 취소</h3>
            <p>취소 사유를 입력해주세요</p>
            <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="취소 사유 입력..." rows={4}/>
            <div className="cancel-modal-btns">
              <button className="cancel-modal-back" onClick={()=>setCancelModal(null)}>돌아가기</button>
              <button className="cancel-modal-confirm" onClick={handleCancelSubmit}>취소 확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 확인 모달 */}
      {passwordModal && (
        <div className="cancel-overlay" onClick={e=>e.target===e.currentTarget&&setPasswordModal(false)}>
          <div className="cancel-modal">
            <h3>정보 변경 확인</h3>
            <p>현재 비밀번호를 입력해주세요</p>
            <input 
              type="password" 
              placeholder="현재 비밀번호" 
              value={currentPassword}
              onChange={e=>setCurrentPassword(e.target.value)}
              onKeyPress={e=>e.key==='Enter'&&!passwordVerifying&&handleConfirmPassword()}
            />
            <div className="cancel-modal-btns">
              <button className="cancel-modal-back" onClick={()=>setPasswordModal(false)} disabled={passwordVerifying}>취소</button>
              <button className="cancel-modal-confirm" onClick={handleConfirmPassword} disabled={passwordVerifying}>
                {passwordVerifying ? '확인 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주문 배송지 변경 모달 */}
      <AddressModal
        isOpen={shippingAddrModalOpen}
        onClose={()=>{ setShippingAddrModalOpen(false); setShippingOrderId(null) }}
        onSelect={handleShippingSelect}
        selectedId={null}
      />

      {/* 내 정보 - 배송지 관리 모달 */}
      <AddressModal
        isOpen={addrModalOpen}
        onClose={()=>{ setAddrModalOpen(false); authFetch('/api/auth/me').then(r=>r.json()).then(d=>{ if(d.success) setUser(d.data) }) }}
        onSelect={async (addr) => {
          // 기본 배송지로 설정
          await authFetch(`/api/addresses/${addr.id}/default`, { method: 'PATCH' })
          const res = await authFetch('/api/auth/me')
          const data = await res.json()
          if (data.success) setUser(data.data)
          setAddrModalOpen(false)
        }}
        selectedId={user.default_address?.id}
      />
    </div>
  )
}