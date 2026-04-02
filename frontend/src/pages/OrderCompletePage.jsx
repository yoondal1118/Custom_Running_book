import { useLocation, useNavigate, Link } from 'react-router-dom'
import './OrderCompletePage.css'

export default function OrderCompletePage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const priceInfo = state?.priceInfo
  const bookTitle = state?.bookTitle || '나의 러닝일지'

  return (
    <div className="complete-page">
      <div className="complete-box">
        <div className="complete-icon">✓</div>
        <h2>주문이 완료되었습니다!</h2>
        <p className="complete-sub">약 2주 내에 배송될 예정입니다</p>

        <div className="complete-info">
          <div className="complete-row">
            <span>책 제목</span>
            <strong>{bookTitle}</strong>
          </div>
          {priceInfo && <>
            <div className="complete-row">
              <span>기본 가격</span>
              <strong>{priceInfo.base_price?.toLocaleString()}원</strong>
            </div>
            <div className="complete-row">
              <span>추가 기록 ({priceInfo.month_count}개월)</span>
              <strong>+{priceInfo.month_price?.toLocaleString()}원</strong>
            </div>
            <div className="complete-row total">
              <span>최종 결제 금액</span>
              <strong>{priceInfo.total_price?.toLocaleString()}원</strong>
            </div>
          </>}
        </div>

        <div className="complete-btns">
          <button
            className="btn-mypage"
            onClick={() => navigate('/mypage', { state: { tab: 'orders' } })}
          >
            주문 내역 확인하기
          </button>
          <Link to="/" className="btn-home">메인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  )
}
