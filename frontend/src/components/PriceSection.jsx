import './PriceSection.css'

const includes = [
  '커스텀 표지 인쇄',
  '첫 페이지 — 총 기록 요약 (지구 바퀴수 포함)',
  '월별 보드판 페이지 (최대 12개월)',
  '부록 페이지 (수상경력 + 사진 최대 6장)',
  '커스텀 말 이미지 or 기본 색상 말',
  '무료 배송 (국내)',
]

export default function PriceSection({ onOrderClick }) {
  return (
    <section className="price-section" id="price">
      <div className="section-label" style={{ justifyContent: 'center' }}>가격</div>
      <h2>단 한 권의<br />특별한 책</h2>
      <div className="price-card">
        <div className="price-main"><sup>₩</sup>39,000</div>
        <div className="price-sub">배송비 포함 · VAT 포함</div>
        <div className="price-includes">
          {includes.map(item => (
            <div key={item} className="price-include-item">
              <div className="price-check">✓</div>
              {item}
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ width: '100%', fontSize: 17 }} onClick={onOrderClick}>
          지금 주문하기
        </button>
      </div>
    </section>
  )
}
