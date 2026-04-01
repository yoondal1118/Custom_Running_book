import { useState } from 'react'
import './OrderModal.css'

const PIECE_COLORS = [
  { id: 'blue', label: '블루', fill: '#1E4FA3', light: '#4A7DD4' },
  { id: 'pink', label: '핑크', fill: '#C94075', light: '#E07099' },
  { id: 'yellow', label: '노랑', fill: '#D4A017', light: '#EEC04A' },
  { id: 'green', label: '초록', fill: '#2D6A3F', light: '#5A9E6E' },
]

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

export default function OrderModal({ isOpen, onClose }) {
  const [selectedPiece, setSelectedPiece] = useState('blue')
  const [runRows, setRunRows] = useState([{ date: '', km: '', pace: '', memo: '' }])
  const [awards, setAwards] = useState([{ name: '', result: '' }])
  const [photos, setPhotos] = useState([])
  const [customPieceUrl, setCustomPieceUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', startDate: '', endDate: '', bookTitle: '',
    address: '', addressDetail: '', postalCode: '', phone: ''
  })

  if (!isOpen) return null

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const addRunRow = () => setRunRows(prev => [...prev, { date: '', km: '', pace: '', memo: '' }])
  const removeRunRow = (i) => runRows.length > 1 && setRunRows(prev => prev.filter((_, idx) => idx !== i))
  const updateRunRow = (i, key, val) => setRunRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r))

  const addAward = () => setAwards(prev => [...prev, { name: '', result: '' }])
  const removeAward = (i) => awards.length > 1 && setAwards(prev => prev.filter((_, idx) => idx !== i))
  const updateAward = (i, key, val) => setAwards(prev => prev.map((a, idx) => idx === i ? { ...a, [key]: val } : a))

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 6)
    setPhotos(files.map(f => ({ file: f, url: URL.createObjectURL(f) })))
  }
  const handleCustomPiece = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCustomPieceUrl(URL.createObjectURL(file))
      setSelectedPiece('custom')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // TODO: 백엔드 연결 시 여기서 fetch('/api/books/create', ...) 호출
    await new Promise(r => setTimeout(r, 1000))
    alert('주문이 접수되었습니다! 이메일로 확인 안내가 발송됩니다.')
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>주문서 작성</h2>
        <p className="modal-sub">모든 정보를 입력 후 제출하면 이메일로 확인 안내가 발송됩니다.</p>

        {/* 기본 정보 */}
        <div className="form-section-title">기본 정보</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">이름</label>
            <input className="form-input" placeholder="홍길동" value={form.name} onChange={e => updateForm('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input className="form-input" type="email" placeholder="example@email.com" value={form.email} onChange={e => updateForm('email', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">기록 시작일</label>
            <input className="form-input" type="date" value={form.startDate} onChange={e => updateForm('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">기록 종료일</label>
            <input className="form-input" type="date" value={form.endDate} onChange={e => updateForm('endDate', e.target.value)} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">책 제목 (비워두면 "나의 러닝일지")</label>
          <input className="form-input" placeholder="나의 러닝일지 2024" value={form.bookTitle} onChange={e => updateForm('bookTitle', e.target.value)} />
        </div>

        {/* 러닝 기록 */}
        <div className="form-section-title">날짜별 러닝 기록</div>
        <div className="run-table-wrap">
          <table className="run-table">
            <thead>
              <tr>
                <th>날짜</th><th>거리 (km)</th><th>페이스 (분/km)</th><th>메모</th><th></th>
              </tr>
            </thead>
            <tbody>
              {runRows.map((row, i) => (
                <tr key={i}>
                  <td><input className="td-input" type="date" value={row.date} onChange={e => updateRunRow(i, 'date', e.target.value)} /></td>
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
        <div className="form-section-title">보드판 말 선택</div>
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
            <div
              className={`piece-upload${selectedPiece === 'custom' ? ' selected' : ''}`}
              onClick={() => document.getElementById('customPieceInput').click()}
              style={customPieceUrl ? { backgroundImage: `url(${customPieceUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
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
            <input className="form-input" placeholder="대회명 (예: 서울 마라톤 2024)" value={a.name} onChange={e => updateAward(i, 'name', e.target.value)} />
            <input className="form-input" placeholder="결과 (예: 완주, 1위 입상)" value={a.result} onChange={e => updateAward(i, 'result', e.target.value)} />
            <button className="remove-btn" onClick={() => removeAward(i)}>×</button>
          </div>
        ))}
        <button className="add-row-btn" onClick={addAward}>+ 수상 경력 추가</button>

        {/* 사진 업로드 */}
        <div className="form-section-title">특별한 사진 (선택 · 최대 6장)</div>
        <div className="photo-upload-area" onClick={() => document.getElementById('photoInput').click()}>
          <div className="upload-icon">📷</div>
          <p>클릭하여 사진 선택 (jpg, png)</p>
          <p style={{ fontSize: 10, marginTop: 4 }}>부록 페이지에 인쇄됩니다</p>
        </div>
        <input type="file" id="photoInput" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotos} />
        {photos.length > 0 && (
          <div className="photo-previews">
            {photos.map((p, i) => <img key={i} src={p.url} alt="" className="photo-thumb" />)}
          </div>
        )}

        {/* 배송지 */}
        <div className="form-section-title">배송지</div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">주소</label>
          <input className="form-input" placeholder="서울특별시 마포구 ..." value={form.address} onChange={e => updateForm('address', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">상세 주소</label>
            <input className="form-input" placeholder="101동 202호" value={form.addressDetail} onChange={e => updateForm('addressDetail', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">우편번호</label>
            <input className="form-input" placeholder="04001" value={form.postalCode} onChange={e => updateForm('postalCode', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">연락처</label>
            <input className="form-input" placeholder="010-1234-5678" value={form.phone} onChange={e => updateForm('phone', e.target.value)} />
          </div>
        </div>

        <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '처리 중...' : '주문 제출하기 →'}
        </button>
      </div>
    </div>
  )
}
