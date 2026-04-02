import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './OrderModal.css'

const PIECE_COLORS = [
  { id: 'blue',   label: '블루',  fill: '#1E4FA3', light: '#4A7DD4' },
  { id: 'pink',   label: '핑크',  fill: '#C94075', light: '#E07099' },
  { id: 'yellow', label: '노랑',  fill: '#D4A017', light: '#EEC04A' },
  { id: 'green',  label: '초록',  fill: '#2D6A3F', light: '#5A9E6E' },
]

const YEARS = [2021, 2022, 2023, 2024, 2025]
const BASE_PRICE = 12000
const PRICE_PER_MONTH = 1000

function PieceSVG({ fill, light }) {
  return (
    <svg width="28" height="56" viewBox="0 0 28 56" fill="none">
      <ellipse cx="14" cy="46" rx="10" ry="6" fill={fill} opacity="0.6" />
      <rect x="10" y="20" width="8" height="24" rx="4" fill={fill} />
      <circle cx="14" cy="13" r="9" fill={fill} />
      <circle cx="14" cy="13" r="5" fill={light} />
    </svg>
  )
}

// 가격 계산 팝업
function PriceConfirmModal({ priceInfo, onConfirm, onClose, loading }) {
  return (
    <div className="price-overlay">
      <div className="price-modal">
        <h3>최종 가격 확인</h3>
        <div className="price-breakdown">
          <div className="price-row">
            <span>기본 가격</span>
            <strong>{BASE_PRICE.toLocaleString()}원</strong>
          </div>
          <div className="price-row">
            <span>추가 기록 ({priceInfo.month_count}개월 × 1,000원)</span>
            <strong>+{priceInfo.month_price.toLocaleString()}원</strong>
          </div>
          <div className="price-row total">
            <span>최종 결제 금액</span>
            <strong>{priceInfo.total_price.toLocaleString()}원</strong>
          </div>
        </div>
        <p className="price-note">* Sandbox 환경으로 실제 결제는 이루어지지 않습니다</p>
        <div className="price-modal-btns">
          <button className="price-back-btn" onClick={onClose}>다시 확인</button>
          <button className="price-confirm-btn" onClick={onConfirm} disabled={loading}>
            {loading ? '처리 중...' : '최종 주문하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderModal({ isOpen, onClose }) {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()

  const [recordYear, setRecordYear] = useState(2024)
  const [selectedPiece, setSelectedPiece] = useState('blue')
  const [runRows, setRunRows] = useState([{ date: '', km: '', pace: '', memo: '' }])
  const [awards, setAwards] = useState([{ name: '', result: '' }])
  const [photos, setPhotos] = useState([])
  const [customPieceUrl, setCustomPieceUrl] = useState(null)
  const [bookTitle, setBookTitle] = useState('')
  const [errors, setErrors] = useState([])
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [priceInfo, setPriceInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      // 사용자 배송지 자동 세팅은 백엔드에서 처리
    }
  }, [isOpen, user])

  if (!isOpen) return null

  // 기록한 월 수 계산
  const getMonthCount = () => {
    const months = new Set()
    runRows.forEach(r => {
      if (r.date && r.km) months.add(r.date.slice(0, 7))
    })
    return months.size
  }

  const calcPrice = () => {
    const month_count = getMonthCount()
    const month_price = month_count * PRICE_PER_MONTH
    return { base_price: BASE_PRICE, month_count, month_price, total_price: BASE_PRICE + month_price }
  }

  // 날짜 유효성 검사 (기록 년도 내에서만)
  const handleDateChange = (i, val) => {
    if (val) {
      const year = parseInt(val.split('-')[0])
      if (year !== recordYear) {
        alert(`기록 년도(${recordYear}년) 내의 날짜만 선택할 수 있습니다`)
        return
      }
    }
    updateRunRow(i, 'date', val)
  }

  // 폼 유효성 검사
  const validate = () => {
    const errs = []
    if (!bookTitle.trim()) errs.push('책 제목을 입력해주세요')
    if (!recordYear) errs.push('기록 년도를 선택해주세요')
    if (!selectedPiece) errs.push('보드판 말을 선택해주세요')

    const validRows = runRows.filter(r => r.date && r.km)
    if (validRows.length === 0) errs.push('날짜별 러닝 기록을 1개 이상 입력해주세요')

    runRows.forEach((r, i) => {
      if (r.date || r.km) {
        if (!r.date) errs.push(`${i + 1}번 기록의 날짜를 입력해주세요`)
        if (!r.km) errs.push(`${i + 1}번 기록의 거리를 입력해주세요`)
        if (!r.pace) errs.push(`${i + 1}번 기록의 페이스를 입력해주세요`)
      }
    })

    if (!user?.address) errs.push('배송지가 등록되어 있지 않습니다. 마이페이지에서 배송지를 등록해주세요')

    return errs
  }

  const handleSubmitClick = () => {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setPriceInfo(calcPrice())
    setShowPriceModal(true)
  }

  const handleFinalSubmit = async () => {
    setSubmitting(true)
    try {
      // 1. 책 생성
      const bookRes = await authFetch('/api/books/create', {
        method: 'POST',
        body: JSON.stringify({
          bookTitle: bookTitle || '나의 러닝일지',
          recordYear,
          selectedPiece,
          runRecords: runRows.filter(r => r.date && r.km),
          awards: awards.filter(a => a.name),
        })
      })
      const bookData = await bookRes.json()
      if (!bookData.success) throw new Error(bookData.detail)

      const bookUid = bookData.data.book_uid

      // 2. 주문 생성
      const orderRes = await authFetch('/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({ bookUid, quantity: 1 })
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.detail)

      setShowPriceModal(false)
      onClose()
      navigate('/order-complete', {
        state: { priceInfo, bookTitle: bookTitle || '나의 러닝일지' }
      })
    } catch (e) {
      alert(`오류 발생: ${e.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const addRunRow = () => setRunRows(p => [...p, { date: '', km: '', pace: '', memo: '' }])
  const removeRunRow = (i) => runRows.length > 1 && setRunRows(p => p.filter((_, idx) => idx !== i))
  const updateRunRow = (i, k, v) => setRunRows(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  const addAward = () => setAwards(p => [...p, { name: '', result: '' }])
  const removeAward = (i) => awards.length > 1 && setAwards(p => p.filter((_, idx) => idx !== i))
  const updateAward = (i, k, v) => setAwards(p => p.map((a, idx) => idx === i ? { ...a, [k]: v } : a))
  const handlePhotos = (e) => setPhotos(Array.from(e.target.files).slice(0, 6).map(f => ({ file: f, url: URL.createObjectURL(f) })))
  const handleCustomPiece = (e) => {
    const file = e.target.files[0]
    if (file) { setCustomPieceUrl(URL.createObjectURL(file)); setSelectedPiece('custom') }
  }

  const monthCount = getMonthCount()
  const previewPrice = BASE_PRICE + monthCount * PRICE_PER_MONTH

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <button className="modal-close" onClick={onClose}>✕</button>
          <h2>주문서 작성</h2>
          <p className="modal-sub">배송지는 회원가입 시 등록한 주소로 자동 설정됩니다.</p>

          {/* 에러 목록 */}
          {errors.length > 0 && (
            <div className="form-errors">
              {errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}

          {/* 기본 정보 */}
          <div className="form-section-title">기본 정보</div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">책 제목 <span className="required">*</span></label>
            <input className="form-input" placeholder="나의 러닝일지 2024" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">기록 년도 <span className="required">*</span></label>
            <select className="form-input" value={recordYear} onChange={e => setRecordYear(Number(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>

          {/* 배송지 안내 */}
          <div className="shipping-info-box">
            <div className="shipping-info-label">배송지</div>
            {user?.address ? (
              <div className="shipping-info-addr">
                {user.postal_code && `[${user.postal_code}] `}{user.address} {user.address_detail}
              </div>
            ) : (
              <div className="shipping-info-warn">
                배송지가 등록되지 않았습니다. <a href="/mypage" target="_blank">마이페이지</a>에서 등록해주세요.
              </div>
            )}
          </div>

          {/* 러닝 기록 */}
          <div className="form-section-title">
            날짜별 러닝 기록 <span className="required">*</span>
            <span className="month-count-badge">{monthCount}개월 기록 → {previewPrice.toLocaleString()}원</span>
          </div>
          <div className="run-table-wrap">
            <table className="run-table">
              <thead>
                <tr><th>날짜</th><th>거리 (km)</th><th>페이스 (분/km)</th><th>메모</th><th></th></tr>
              </thead>
              <tbody>
                {runRows.map((row, i) => (
                  <tr key={i}>
                    <td><input className="td-input" type="date"
                      min={`${recordYear}-01-01`} max={`${recordYear}-12-31`}
                      value={row.date} onChange={e => handleDateChange(i, e.target.value)} /></td>
                    <td><input className="td-input" type="number" placeholder="5.2" min="0" step="0.1" value={row.km} onChange={e => updateRunRow(i, 'km', e.target.value)} /></td>
                    <td><input className="td-input" type="text" placeholder="5'30&quot;" value={row.pace} onChange={e => updateRunRow(i, 'pace', e.target.value)} /></td>
                    <td><input className="td-input" type="text" placeholder="메모" value={row.memo} onChange={e => updateRunRow(i, 'memo', e.target.value)} /></td>
                    <td><button className="remove-btn" onClick={() => removeRunRow(i)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="add-row-btn" onClick={addRunRow}>+ 날짜 추가</button>

          {/* 말 선택 */}
          <div className="form-section-title">보드판 말 선택 <span className="required">*</span></div>
          <div className="piece-selector">
            {PIECE_COLORS.map(p => (
              <div key={p.id} className={`piece-option${selectedPiece === p.id ? ' selected' : ''}`} onClick={() => setSelectedPiece(p.id)}>
                <div className="piece-visual" style={{ background: `${p.fill}22`, border: `2px solid ${selectedPiece === p.id ? p.fill : 'rgba(255,255,255,0.1)'}` }}>
                  <PieceSVG fill={p.fill} light={p.light} />
                </div>
                <div className="piece-name">{p.label}</div>
              </div>
            ))}
            <div>
              <div className={`piece-upload${selectedPiece === 'custom' ? ' selected' : ''}`}
                onClick={() => document.getElementById('customPieceInput').click()}
                style={customPieceUrl ? { backgroundImage: `url(${customPieceUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                {!customPieceUrl && <><div className="upload-plus">+</div><div className="piece-upload-text">이미지<br />업로드</div></>}
              </div>
              <input type="file" id="customPieceInput" accept="image/*" style={{ display: 'none' }} onChange={handleCustomPiece} />
              <div className="piece-name">커스텀</div>
            </div>
          </div>
          <p className="piece-hint">커스텀 이미지 권장 사이즈: 50px × 100px (세로형)</p>

          {/* 수상 경력 */}
          <div className="form-section-title">마라톤 수상 경력 (선택)</div>
          {awards.map((a, i) => (
            <div key={i} className="award-entry">
              <input className="form-input" placeholder="대회명" value={a.name} onChange={e => updateAward(i, 'name', e.target.value)} />
              <input className="form-input" placeholder="결과 (예: 완주)" value={a.result} onChange={e => updateAward(i, 'result', e.target.value)} />
              <button className="remove-btn" onClick={() => removeAward(i)}>×</button>
            </div>
          ))}
          <button className="add-row-btn" onClick={addAward}>+ 수상 경력 추가</button>

          {/* 사진 */}
          <div className="form-section-title">특별한 사진 (선택 · 최대 6장)</div>
          <div className="photo-upload-area" onClick={() => document.getElementById('photoInput').click()}>
            <div className="upload-icon">📷</div>
            <p>클릭하여 사진 선택 (jpg, png)</p>
          </div>
          <input type="file" id="photoInput" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotos} />
          {photos.length > 0 && (
            <div className="photo-previews">
              {photos.map((p, i) => <img key={i} src={p.url} alt="" className="photo-thumb" />)}
            </div>
          )}

          <button className="btn-submit" onClick={handleSubmitClick}>
            주문 제출하기 →
          </button>
        </div>
      </div>

      {showPriceModal && priceInfo && (
        <PriceConfirmModal
          priceInfo={priceInfo}
          onConfirm={handleFinalSubmit}
          onClose={() => setShowPriceModal(false)}
          loading={submitting}
        />
      )}
    </>
  )
}
