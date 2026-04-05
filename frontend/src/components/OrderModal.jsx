import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AddressModal from './AddressModal'
import './OrderModal.css'

const PIECE_COLORS = [
  { id: 'blue',   label: '블루',  fill: '#1E4FA3', light: '#4A7DD4' },
  { id: 'pink',   label: '핑크',  fill: '#C94075', light: '#E07099' },
  { id: 'yellow', label: '노랑',  fill: '#D4A017', light: '#EEC04A' },
  { id: 'green',  label: '초록',  fill: '#2D6A3F', light: '#5A9E6E' },
]
const YEARS = [2021, 2022, 2023, 2024, 2025]
const BASE_PRICE = 12000
const APPENDIX_PRICE = 3000

function PieceSVG({ fill, light }) {
  return (
    <svg width="28" height="56" viewBox="0 0 28 56" fill="none">
      <ellipse cx="14" cy="46" rx="10" ry="6" fill={fill} opacity="0.6"/>
      <rect x="10" y="20" width="8" height="24" rx="4" fill={fill}/>
      <circle cx="14" cy="13" r="9" fill={fill}/>
      <circle cx="14" cy="13" r="5" fill={light}/>
    </svg>
  )
}

// ── 단계 1: 주문서 작성 ──────────────────────────────────
function StepForm({ onNext, user }) {
  const [recordYear, setRecordYear] = useState(2024)
  const [selectedPiece, setSelectedPiece] = useState('blue')
  const [runRows, setRunRows] = useState([{ date: '', km: '', pace: '', memo: '' }])
  const [awards, setAwards] = useState([{ name: '', result: '' }])
  const [bookTitle, setBookTitle] = useState('')
  const [errors, setErrors] = useState([])
  const [customPieceUrl, setCustomPieceUrl] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState(user?.default_address || null)
  const [addrModalOpen, setAddrModalOpen] = useState(false)

  const fillDummyData = () => {
    setBookTitle('나의 러닝일지 2024')
    setRecordYear(2024)
    setSelectedPiece('blue')
    setRunRows([
      { date: '2024-01-03', km: '3.2',    pace: "6'30\"", memo: '새해 첫 러닝!' },
      { date: '2024-01-10', km: '8.5',    pace: "5'45\"", memo: '컨디션 좋음' },
      { date: '2024-01-20', km: '21.1',   pace: "5'10\"", memo: '하프 마라톤 완주!!' },
      { date: '2024-02-07', km: '9.0',    pace: "5'40\"", memo: '' },
      { date: '2024-02-25', km: '20.0',   pace: "5'10\"", memo: '대회 준비 20km' },
      { date: '2024-03-10', km: '42.195', pace: "5'05\"", memo: '풀마라톤 완주!!!' },
      { date: '2024-04-05', km: '6.5',    pace: "5'50\"", memo: '' },
      { date: '2024-05-14', km: '11.0',   pace: "5'20\"", memo: '' },
      { date: '2024-06-22', km: '7.0',    pace: "5'45\"", memo: '여름 저녁 러닝' },
      { date: '2024-07-08', km: '5.5',    pace: "6'00\"", memo: '더위에도 완주' },
      { date: '2024-08-19', km: '4.2',    pace: "6'10\"", memo: '' },
      { date: '2024-09-15', km: '15.0',   pace: "5'15\"", memo: '가을 롱런' },
      { date: '2024-10-06', km: '42.195', pace: "4'58\"", memo: '시즌 최고 기록!' },
      { date: '2024-11-03', km: '10.0',   pace: "5'30\"", memo: '' },
      { date: '2024-12-31', km: '5.0',    pace: "6'00\"", memo: '올해 마지막 러닝' },
    ])
    setAwards([
      { name: '2024 서울 하프마라톤', result: '완주 (2:10:35)' },
      { name: '2024 춘천 마라톤',     result: '완주 (4:28:12)' },
    ])
  }

  const handleDateChange = (i, val) => {
    if (val && parseInt(val.split('-')[0]) !== recordYear) {
      alert(`기록 년도(${recordYear}년) 내의 날짜만 선택할 수 있습니다`)
      return
    }
    setRunRows(p => p.map((r, idx) => idx === i ? { ...r, date: val } : r))
  }

  const validate = () => {
    const errs = []
    if (!bookTitle.trim()) errs.push('책 제목을 입력해주세요')
    if (!selectedPiece) errs.push('보드판 말을 선택해주세요')
    const valid = runRows.filter(r => r.date && r.km)
    if (valid.length === 0) errs.push('러닝 기록을 1개 이상 입력해주세요')
    runRows.forEach((r, i) => {
      if ((r.date || r.km) && (!r.date || !r.km || !r.pace))
        errs.push(`${i+1}번 기록의 날짜·거리·페이스를 모두 입력해주세요`)
    })
    if (!selectedAddress) errs.push('배송지를 선택해주세요')
    return errs
  }

  const handleNext = () => {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    onNext({
      bookTitle, recordYear, selectedPiece,
      runRecords: runRows.filter(r => r.date && r.km),
      awards, selectedAddress
    })
  }

  const addRow    = () => setRunRows(p => [...p, { date:'', km:'', pace:'', memo:'' }])
  const removeRow = (i) => runRows.length > 1 && setRunRows(p => p.filter((_,idx) => idx !== i))
  const updateRow = (i,k,v) => setRunRows(p => p.map((r,idx) => idx===i ? {...r,[k]:v} : r))
  const addAward    = () => setAwards(p => [...p, { name:'', result:'' }])
  const removeAward = (i) => awards.length > 1 && setAwards(p => p.filter((_,idx) => idx !== i))
  const updateAward = (i,k,v) => setAwards(p => p.map((a,idx) => idx===i ? {...a,[k]:v} : a))

  return (
    <>
      <h2>주문서 작성</h2>
      <button className="dummy-fill-btn" onClick={fillDummyData}>📋 테스트 데이터로 채우기</button>

      {errors.length > 0 && <div className="form-errors">{errors.map((e,i) => <div key={i}>• {e}</div>)}</div>}

      <div className="form-section-title">기본 정보</div>
      <div className="form-group" style={{marginBottom:12}}>
        <label className="form-label">책 제목 <span className="required">*</span></label>
        <input className="form-input" placeholder="나의 러닝일지 2024" value={bookTitle} onChange={e=>setBookTitle(e.target.value)}/>
      </div>
      <div className="form-group" style={{marginBottom:12}}>
        <label className="form-label">기록 년도 <span className="required">*</span></label>
        <select className="form-input" value={recordYear} onChange={e=>setRecordYear(Number(e.target.value))}>
          {YEARS.map(y=><option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* 배송지 */}
      <div className="form-section-title">배송지 <span className="required">*</span></div>
      <div className="shipping-info-box">
        <div className="shipping-info-label">선택된 배송지</div>
        {selectedAddress ? (
          <div className="shipping-info-addr">
            [{selectedAddress.postal_code}] {selectedAddress.address1} {selectedAddress.address2}
            <br/>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>
              {selectedAddress.recipient_name} · {selectedAddress.recipient_phone}
            </span>
          </div>
        ) : (
          <div className="shipping-info-warn">배송지를 선택해주세요</div>
        )}
        <button className="addr-change-btn" onClick={() => setAddrModalOpen(true)}>
          배송지 변경하기
        </button>
      </div>
      <AddressModal
        isOpen={addrModalOpen}
        onClose={() => setAddrModalOpen(false)}
        onSelect={addr => setSelectedAddress(addr)}
        selectedId={selectedAddress?.id}
      />

      {/* 러닝 기록 */}
      <div className="form-section-title">날짜별 러닝 기록 <span className="required">*</span></div>
      <div className="run-table-wrap">
        <table className="run-table">
          <thead><tr><th>날짜</th><th>거리(km)</th><th>페이스</th><th>메모</th><th></th></tr></thead>
          <tbody>
            {runRows.map((row,i)=>(
              <tr key={i}>
                <td><input className="td-input" type="date" min={`${recordYear}-01-01`} max={`${recordYear}-12-31`} value={row.date} onChange={e=>handleDateChange(i,e.target.value)}/></td>
                <td><input className="td-input" type="number" placeholder="5.2" step="0.1" value={row.km} onChange={e=>updateRow(i,'km',e.target.value)}/></td>
                <td><input className="td-input" type="text" placeholder="5'30&quot;" value={row.pace} onChange={e=>updateRow(i,'pace',e.target.value)}/></td>
                <td><input className="td-input" type="text" placeholder="메모" value={row.memo} onChange={e=>updateRow(i,'memo',e.target.value)}/></td>
                <td><button className="remove-btn" onClick={()=>removeRow(i)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="add-row-btn" onClick={addRow}>+ 날짜 추가</button>

      {/* 말 선택 */}
      <div className="form-section-title">보드판 말 선택 <span className="required">*</span></div>
      <div className="piece-selector">
        {PIECE_COLORS.map(p=>(
          <div key={p.id} className={`piece-option${selectedPiece===p.id?' selected':''}`} onClick={()=>setSelectedPiece(p.id)}>
            <div className="piece-visual" style={{background:`${p.fill}22`,border:`2px solid ${selectedPiece===p.id?p.fill:'rgba(255,255,255,0.1)'}`}}>
              <PieceSVG fill={p.fill} light={p.light}/>
            </div>
            <div className="piece-name">{p.label}</div>
          </div>
        ))}
        <div>
          <div className={`piece-upload${selectedPiece==='custom'?' selected':''}`}
            onClick={()=>document.getElementById('customPieceInput').click()}
            style={customPieceUrl?{backgroundImage:`url(${customPieceUrl})`,backgroundSize:'cover'}:{}}>
            {!customPieceUrl&&<><div className="upload-plus">+</div><div className="piece-upload-text">이미지<br/>업로드</div></>}
          </div>
          <input type="file" id="customPieceInput" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){setCustomPieceUrl(URL.createObjectURL(f));setSelectedPiece('custom')}}}/>
          <div className="piece-name">커스텀</div>
        </div>
      </div>

      {/* 수상 경력 */}
      <div className="form-section-title">마라톤 수상 경력 (선택 — 부록 +3,000원)</div>
      {awards.map((a,i)=>(
        <div key={i} className="award-entry">
          <input className="form-input" placeholder="대회명" value={a.name} onChange={e=>updateAward(i,'name',e.target.value)}/>
          <input className="form-input" placeholder="결과" value={a.result} onChange={e=>updateAward(i,'result',e.target.value)}/>
          <button className="remove-btn" onClick={()=>removeAward(i)}>×</button>
        </div>
      ))}
      <button className="add-row-btn" onClick={addAward}>+ 수상 경력 추가</button>

      <button className="btn-submit" onClick={handleNext}>주문 제출하기 →</button>
    </>
  )
}

// ── 단계 2: 제출서 확인 ──────────────────────────────────
function StepConfirm({ formData, onBack, onBuild }) {
  const hasAppendix = formData.awards.some(a => a.name)
  const totalPrice  = BASE_PRICE + (hasAppendix ? APPENDIX_PRICE : 0)
  const grouped = {}
  formData.runRecords.forEach(r => {
    const m = r.date.slice(0,7)
    if (!grouped[m]) grouped[m] = []
    grouped[m].push(r)
  })

  return (
    <>
      <h2>제출서 확인</h2>
      <p className="modal-sub">입력하신 내용을 확인해주세요.</p>

      <div className="confirm-section">
        <div className="confirm-label">기본 정보</div>
        <div className="confirm-row"><span>책 제목</span><strong>{formData.bookTitle}</strong></div>
        <div className="confirm-row"><span>기록 년도</span><strong>{formData.recordYear}년</strong></div>
        <div className="confirm-row"><span>보드판 말</span><strong>{formData.selectedPiece}</strong></div>
      </div>

      <div className="confirm-section">
        <div className="confirm-label">배송지</div>
        <div className="confirm-row">
          <span>주소</span>
          <strong style={{fontSize:12}}>
            [{formData.selectedAddress?.postal_code}] {formData.selectedAddress?.address1} {formData.selectedAddress?.address2}
          </strong>
        </div>
        <div className="confirm-row">
          <span>수령인</span>
          <strong>{formData.selectedAddress?.recipient_name} · {formData.selectedAddress?.recipient_phone}</strong>
        </div>
      </div>

      <div className="confirm-section">
        <div className="confirm-label">러닝 기록 ({formData.runRecords.length}건)</div>
        <div className="confirm-records">
          {Object.entries(grouped).sort().map(([ym, records]) => (
            <div key={ym}>
              <div className="confirm-month">{ym.replace('-','년 ')}월</div>
              {records.map((r,i) => (
                <div key={i} className="confirm-record-row">
                  <span className="rec-date">{r.date.slice(5).replace('-','/')}</span>
                  <span className="rec-km">{r.km}km</span>
                  <span className="rec-pace">{r.pace}</span>
                  {r.memo && <span className="rec-memo">{r.memo}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {formData.awards.some(a=>a.name) && (
        <div className="confirm-section">
          <div className="confirm-label">부록 — 수상 경력</div>
          {formData.awards.filter(a=>a.name).map((a,i)=>(
            <div key={i} className="confirm-row"><span>{a.name}</span><strong>{a.result}</strong></div>
          ))}
        </div>
      )}

      <div className="confirm-price-box">
        <div className="confirm-price-row"><span>기본 가격</span><strong>{BASE_PRICE.toLocaleString()}원</strong></div>
        <div className="confirm-price-row"><span>부록</span><strong>{hasAppendix?`+${APPENDIX_PRICE.toLocaleString()}원`:'미포함'}</strong></div>
        <div className="confirm-price-row total"><span>예상 결제 금액</span><strong>{totalPrice.toLocaleString()}원</strong></div>
      </div>

      <div className="confirm-btns">
        <button className="btn-back" onClick={onBack}>다시 확인</button>
        <button className="btn-build" onClick={()=>onBuild(formData)}>책 생성하기 →</button>
      </div>
    </>
  )
}

// ── 단계 3: 로딩 (SSE) ──────────────────────────────────
function StepLoading({ formData, onDone }) {
  const [step, setStep] = useState('준비 중...')
  const [pct,  setPct]  = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const token = localStorage.getItem('rb_token')

    fetch('/api/books/create-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    }).then(async res => {
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const msg = JSON.parse(line.slice(6))
            if (!isMounted) return
            if (msg.error) { setError(msg.error); return }
            if (msg.step)  { setStep(msg.step); setPct(msg.pct) }
            if (msg.done)  { onDone({ result: msg.result, price_info: msg.price_info, formData }) }
          } catch {}
        }
      }
    }).catch(e => { if (isMounted) setError(e.message) })

    return () => { isMounted = false }
  }, [])

  return (
    <>
      <h2>책 생성 중...</h2>
      <p className="modal-sub">잠시만 기다려주세요. 약 1~2분 소요됩니다.</p>
      <div className="loading-step">{step}</div>
      <div className="loading-bar-wrap">
        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{width:`${pct}%`}}/>
        </div>
        <div className="loading-pct">{pct}%</div>
      </div>
      {error && <div className="form-errors" style={{marginTop:24}}>오류 발생: {error}</div>}
    </>
  )
}

// ── 단계 4: 완료 + 가격 확인 ──────────────────────────────
function StepComplete({ data, onCancel, onOrder }) {
  const { result, price_info, formData } = data
  const { authFetch } = useAuth()
  const [ordering, setOrdering] = useState(false)
  const [enlarged, setEnlarged] = useState(false)
  const [estimate, setEstimate] = useState(null)
  const [estimateLoading, setEstimateLoading] = useState(true)
  const [estimateError, setEstimateError]  = useState(null)
  const hasAppendix = formData.awards.some(a => a.name)
  const totalPrice  = BASE_PRICE + (hasAppendix ? APPENDIX_PRICE : 0)

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res  = await authFetch('/api/orders/estimate', {
          method: 'POST',
          body: JSON.stringify({ bookUid: result.book_uid, quantity: 1 })
        })
        const json = await res.json()
        if (json.success) setEstimate(json.data)
        else setEstimateError('금액 조회 실패')
      } catch (e) {
        setEstimateError(e.message)
      } finally {
        setEstimateLoading(false)
      }
    }
    fetchEstimate()
  }, [])

  const handleOrder = async () => {
    setOrdering(true)
    await onOrder()
    setOrdering(false)
  }

  return (
    <>
      <h2>책 생성 완료!</h2>
      <p className="modal-sub">아래 내용을 확인 후 최종 주문해주세요.</p>

      <div className="confirm-price-box" style={{marginBottom:20}}>
        {estimateLoading ? (
          <div className="estimate-loading">금액 조회 중...</div>
        ) : estimateError ? (
          <>
            <div className="confirm-price-row"><span>기본 가격</span><strong>{price_info.base_price.toLocaleString()}원</strong></div>
            <div className="confirm-price-row"><span>부록</span><strong>{price_info.has_appendix?`+${price_info.appendix_price.toLocaleString()}원`:'미포함'}</strong></div>
            <div className="confirm-price-row total"><span>예상 결제 금액</span><strong>{price_info.total_price.toLocaleString()}원</strong></div>
          </>
        ) : (
          <>
            <div className="confirm-price-row"><span>기본 가격</span><strong>{BASE_PRICE.toLocaleString()}원</strong></div>
            <div className="confirm-price-row"><span>부록</span><strong>{hasAppendix?`+${APPENDIX_PRICE.toLocaleString()}원`:'미포함'}</strong></div>
            <div className="confirm-price-row total"><span>최종 결제 금액</span><strong>{totalPrice.toLocaleString()}원</strong></div>
          </>
        )}
      </div>

      {result?.preview_b64 && (
        <div className="preview-image-wrap">
          <div className="preview-image-header">
            <div className="preview-image-label">보드판 미리보기</div>
            <div className="preview-image-notice">⚠ 예시 이미지로 실제와 다를 수 있습니다</div>
          </div>
          <div className="preview-image-container" onClick={()=>setEnlarged(true)}>
            <img src={result.preview_b64} alt="보드판 미리보기" className="preview-image"/>
            <div className="preview-zoom-hint">🔍 클릭하여 확대</div>
          </div>
        </div>
      )}

      {enlarged && (
        <div className="preview-enlarged-overlay" onClick={()=>setEnlarged(false)}>
          <div className="preview-enlarged-inner" onClick={e=>e.stopPropagation()}>
            <button className="preview-enlarged-close" onClick={()=>setEnlarged(false)}>✕</button>
            <div className="preview-enlarged-notice">⚠ 예시 이미지로 실제와 다를 수 있습니다</div>
            <img src={result.preview_b64} alt="보드판 미리보기 확대"/>
          </div>
        </div>
      )}

      <p style={{fontSize:11,color:'rgba(255,255,255,0.2)',margin:'12px 0',textAlign:'center'}}>
        * Sandbox 환경으로 실제 결제는 이루어지지 않습니다
      </p>

      <div className="confirm-btns">
        <button className="btn-back" onClick={onCancel}>취소하기</button>
        <button className="btn-build" onClick={handleOrder}
          disabled={ordering || (!estimate?.creditSufficient && !estimateLoading)}>
          {ordering?'주문 처리 중...':'주문하기 →'}
        </button>
      </div>
    </>
  )
}

// ── 메인 모달 ──────────────────────────────────────────
export default function OrderModal({ isOpen, onClose }) {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [formData, setFormData] = useState(null)
  const [completeData, setCompleteData] = useState(null)

  if (!isOpen) return null

  const handleClose = () => {
    setStep('form'); setFormData(null); setCompleteData(null); onClose()
  }

  const handleOrder = async () => {
    try {
      const res = await authFetch('/api/books/confirm-order', {
        method: 'POST',
        body: JSON.stringify({
          bookUid:     completeData.result.book_uid,
          bookTitle:   completeData.formData.bookTitle,
          recordYear:  completeData.formData.recordYear,
          totalPrice:  completeData.price_info.total_price,
          hasAppendix: completeData.price_info.has_appendix,
          addressId:   completeData.formData.selectedAddress?.id,
        })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail)
      handleClose()
      navigate('/order-complete', {
        state: { priceInfo: completeData.price_info, bookTitle: completeData.formData.bookTitle }
      })
    } catch (e) {
      alert('주문 중 오류: ' + e.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&handleClose()}>
      <div className="modal">
        {step !== 'loading' && <button className="modal-close" onClick={handleClose}>✕</button>}
        {step === 'form' && <StepForm user={user} onNext={d=>{setFormData(d);setStep('confirm')}}/>}
        {step === 'confirm' && <StepConfirm formData={formData} onBack={()=>setStep('form')} onBuild={()=>setStep('loading')}/>}
        {step === 'loading' && <StepLoading formData={formData} onDone={d=>{setCompleteData(d);setStep('complete')}}/>}
        {step === 'complete' && <StepComplete data={completeData} onCancel={handleClose} onOrder={handleOrder}/>}
      </div>
    </div>
  )
}