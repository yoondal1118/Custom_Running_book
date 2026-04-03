import { useState } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import PagePreviews from '../components/PagePreviews'
import PriceSection from '../components/PriceSection'
import OrderModal from '../components/OrderModal'
import './Landing.css'

const FEATURES = [
  '월별 보드판 디자인', '날짜별 km · 페이스 기록',
  '지구 바퀴수 자동 계산', '수상경력 · 사진 부록', '커스텀 말 이미지'
]

const ORDER_STEPS = [
  { num: 1, title: '기간 선택', desc: '기록을 남길 시작일과 종료일을 선택합니다' },
  { num: 2, title: '러닝 기록 입력', desc: '날짜별로 달린 거리(km)와 페이스(분/km)를 입력합니다' },
  { num: 3, title: '말 이미지 선택', desc: '보드판에 올라갈 말을 색상으로 선택하거나 직접 이미지를 업로드합니다' },
  { num: 4, title: '부록 정보 입력 (선택)', desc: '수상경력이나 특별한 사진이 있다면 부록에 추가할 수 있습니다' },
  { num: 5, title: '주문 완료', desc: '제작 후 약 2주 내 배송됩니다' },
]

export default function Landing() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Navbar onOrderClick={() => setModalOpen(true)} />

      <Hero onOrderClick={() => setModalOpen(true)} />

      {/* Features strip */}
      <div className="features-strip">
        {FEATURES.map((f, i) => (
          <div key={f} className="feature-item">
            {i > 0 && <div className="feature-dot" />}
            {f}
          </div>
        ))}
      </div>

      <PagePreviews />

      {/* Order CTA section */}
      <section className="order-section" id="order">
        <div className="order-layout">
          <div className="order-left">
            <div className="section-label" style={{ color: '#F5A06B' }}>주문 안내</div>
            <h2>직접 기록을<br />입력하고<br /><em>주문하세요</em></h2>
            <p>아래 양식에 날짜별 러닝 기록을 입력하면<br />약 2주 내 완성본을 배송해드립니다.</p>
            <div className="order-steps">
              {ORDER_STEPS.map(s => (
                <div key={s.num} className="order-step">
                  <div className="order-step-num">{s.num}</div>
                  <div className="order-step-text">
                    <strong>{s.title}</strong>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <button
              className="btn-primary"
              style={{ width: '100%', fontSize: 20, padding: 20 }}
              onClick={() => setModalOpen(true)}
            >
              지금 주문서 작성하기 →
            </button>
            <p className="order-note">주문 후 이메일로 최종 확인이 발송됩니다</p>
          </div>
        </div>
      </section>

      <PriceSection onOrderClick={() => setModalOpen(true)} />

      <footer className="footer">
        <div className="footer-logo">러닝일지북</div>
        <p>© 2026 러닝일지북. 커스텀 러닝 기록북 제작 서비스.</p>
      </footer>

      <OrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
