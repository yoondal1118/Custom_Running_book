import { useState, useEffect, useRef } from 'react'
import './BookPreview.css'

export default function BookPreview({ pages, isOpen, onClose }) {
  const [current, setCurrent] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return;
    // 우클릭 방지
    const prevent = e => e.preventDefault()
    const el = containerRef.current
    if (el) el.addEventListener('contextmenu', prevent)
    return () => { if (el) el.removeEventListener('contextmenu', prevent) }
  }, [isOpen])

  if (!isOpen || !pages?.length) {
    if (current !== 0) setCurrent(0)
    return null
  }
  
  const prev = () => setCurrent(p => Math.max(0, p - 1))
  const next = () => setCurrent(p => Math.min(pages.length - 1, p + 1))

  const page = pages[current]

  return (
    <div className="bp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bp-modal">

        {/* 헤더 */}
        <div className="bp-header">
          <div className="bp-title">책 미리보기</div>
          <div className="bp-notice">⚠ 미리보기 전용 — 실제 인쇄물과 다를 수 있습니다</div>
          <button className="bp-close" onClick={onClose}>✕</button>
        </div>

        {/* 이미지 뷰어 */}
        <div className="bp-viewer" ref={containerRef}>
          <div
            className="bp-image-wrap"
            style={{ backgroundImage: `url(${page.b64})` }}
            onDragStart={e => e.preventDefault()}
          >
            {/* 워터마크 레이어 */}
            <div className="bp-watermark" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bp-watermark-row">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <span key={j}>미리보기 · PREVIEW · 나의 러닝일지북</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 좌우 네비게이션 */}
          {current > 0 && (
            <button className="bp-nav bp-nav-left" onClick={prev}>‹</button>
          )}
          {current < pages.length - 1 && (
            <button className="bp-nav bp-nav-right" onClick={next}>›</button>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="bp-footer">
          <div className="bp-page-label">{page.label}</div>
          <div className="bp-page-count">{current + 1} / {pages.length}</div>
        </div>

        {/* 썸네일 스트립 */}
        <div className="bp-thumbnails">
          {pages.map((p, i) => (
            <div
              key={i}
              className={`bp-thumb${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              style={{ backgroundImage: `url(${p.b64})` }}
            >
              <div className="bp-thumb-label">{p.label}</div>
              {/* 썸네일에도 워터마크 */}
              <div className="bp-thumb-wm" aria-hidden="true" />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}