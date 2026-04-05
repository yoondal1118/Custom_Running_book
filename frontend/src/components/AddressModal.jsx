import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AddressModal.css'

export default function AddressModal({ isOpen, onClose, onSelect, selectedId }) {
  const { authFetch } = useAuth()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkedId, setCheckedId] = useState(selectedId || null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({
    recipient_name: '', recipient_phone: '', postal_code: '',
    address1: '', address2: '', is_default: false
  })
  const [addMsg, setAddMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCheckedId(selectedId || null)
      setShowAddForm(false)
      setAddMsg('')
      fetchAddresses()
    }
  }, [isOpen, selectedId])

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/addresses')
      const data = await res.json()
      if (data.success) {
        setAddresses(data.data)
        // 기본 배송지 자동 선택
        if (!checkedId) {
          const def = data.data.find(a => a.is_default)
          if (def) setCheckedId(def.id)
        }
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleAddSubmit = async () => {
    if (!addForm.recipient_name || !addForm.address1 || !addForm.postal_code) {
      setAddMsg('수령인, 우편번호, 주소는 필수입니다')
      return
    }
    try {
      const res = await authFetch('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(addForm)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      setAddMsg('배송지가 추가되었습니다')
      setAddForm({ recipient_name: '', recipient_phone: '', postal_code: '', address1: '', address2: '', is_default: false })
      setShowAddForm(false)
      await fetchAddresses()
      setCheckedId(data.data.id)
    } catch (e) {
      setAddMsg(`오류: ${e.message}`)
    }
  }

  const handleConfirm = () => {
    const selected = addresses.find(a => a.id === checkedId)
    if (!selected) { alert('배송지를 선택해주세요'); return }
    onSelect(selected)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="addr-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="addr-modal">
        <div className="addr-header">
          <h3>배송지 선택</h3>
          <button className="addr-close" onClick={onClose}>✕</button>
        </div>

        {/* 배송지 목록 */}
        <div className="addr-list">
          {loading ? (
            <div className="addr-empty">불러오는 중...</div>
          ) : addresses.length === 0 ? (
            <div className="addr-empty">등록된 배송지가 없습니다</div>
          ) : addresses.map(a => (
            <div
              key={a.id}
              className={`addr-item${checkedId === a.id ? ' selected' : ''}`}
              onClick={() => setCheckedId(a.id)}
            >
              <div className="addr-check">
                <div className={`addr-radio${checkedId === a.id ? ' on' : ''}`} />
              </div>
              <div className="addr-info">
                <div className="addr-name-row">
                  <span className="addr-recipient">{a.recipient_name}</span>
                  <span className="addr-phone">{a.recipient_phone}</span>
                  {a.is_default && <span className="addr-badge">기본</span>}
                </div>
                <div className="addr-address">
                  [{a.postal_code}] {a.address1} {a.address2}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 배송지 추가 폼 */}
        {showAddForm ? (
          <div className="addr-add-form">
            <div className="addr-add-title">새 배송지 추가</div>
            {[
              { label: '수령인 *',   key: 'recipient_name',  placeholder: '홍길동' },
              { label: '연락처',     key: 'recipient_phone', placeholder: '010-0000-0000' },
              { label: '우편번호 *', key: 'postal_code',     placeholder: '00000' },
              { label: '주소 *',     key: 'address1',        placeholder: '도로명 주소' },
              { label: '상세주소',   key: 'address2',        placeholder: '동/호수' },
            ].map(f => (
              <div key={f.key} className="addr-field">
                <label>{f.label}</label>
                <input
                  placeholder={f.placeholder}
                  value={addForm[f.key]}
                  onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <label className="addr-default-check">
              <input
                type="checkbox"
                checked={addForm.is_default}
                onChange={e => setAddForm(p => ({ ...p, is_default: e.target.checked }))}
              />
              기본 배송지로 설정
            </label>
            {addMsg && <div className={`addr-msg${addMsg.startsWith('오류') ? ' err' : ''}`}>{addMsg}</div>}
            <div className="addr-add-btns">
              <button className="addr-cancel-btn" onClick={() => { setShowAddForm(false); setAddMsg('') }}>취소</button>
              <button className="addr-confirm-btn" onClick={handleAddSubmit}>확인</button>
            </div>
          </div>
        ) : (
          <button className="addr-add-open-btn" onClick={() => { setShowAddForm(true); setAddMsg('') }}>
            + 배송지 추가하기
          </button>
        )}

        {/* 하단 버튼 */}
        {!showAddForm && (
          <div className="addr-footer">
            <button className="addr-cancel-btn" onClick={onClose}>닫기</button>
            <button className="addr-confirm-btn" onClick={handleConfirm}>배송지 변경하기</button>
          </div>
        )}
      </div>
    </div>
  )
}