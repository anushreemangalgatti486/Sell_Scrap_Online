import React, { useEffect, useRef, useState } from 'react'
import './ComparisonSection.css'

/* ─────────────────────────────────────────────
   Inline SVG: person figure
───────────────────────────────────────────── */
const Person = ({ color = '#475569', helmetColor = null, vestColor = null, size = 52 }) => (
  <svg width={size} height={size * 2.1} viewBox="0 0 52 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* shadow */}
    <ellipse cx="26" cy="106" rx="16" ry="4" fill="rgba(0,0,0,0.3)" />
    {/* legs */}
    <rect x="17" y="66" width="8" height="36" rx="3" fill="#1f2937" />
    <rect x="27" y="66" width="8" height="36" rx="3" fill="#374151" />
    {/* shoes */}
    <ellipse cx="21" cy="104" rx="7" ry="3.5" fill="#111827" />
    <ellipse cx="31" cy="104" rx="7" ry="3.5" fill="#111827" />
    {/* torso */}
    <rect x="15" y="38" width="22" height="30" rx="4" fill={vestColor || color} />
    {/* vest stripe */}
    {vestColor && <rect x="23" y="38" width="6" height="30" rx="2" fill="rgba(255,255,255,0.15)" />}
    {/* left arm */}
    <rect x="6"  y="40" width="8" height="22" rx="3" fill={vestColor || color} />
    {/* right arm */}
    <rect x="38" y="40" width="8" height="22" rx="3" fill={vestColor || color} />
    {/* neck */}
    <rect x="22" y="32" width="8" height="8" rx="2" fill="#f0c88c" />
    {/* head */}
    <circle cx="26" cy="22" r="13" fill="#f0c88c" />
    {/* face details */}
    <circle cx="22" cy="22" r="1.5" fill="#6b4423" />
    <circle cx="30" cy="22" r="1.5" fill="#6b4423" />
    <path d="M22 27 Q26 30 30 27" stroke="#c8977a" strokeWidth="1" fill="none" strokeLinecap="round" />
    {/* hair */}
    <ellipse cx="26" cy="11" rx="12" ry="7" fill="#5c3317" />
    {/* helmet */}
    {helmetColor && <>
      <rect x="13" y="17" width="26" height="5" rx="2" fill={helmetColor} />
      <path d="M13 20 Q26 8 39 20" fill={helmetColor} />
    </>}
  </svg>
)

/* ─────────────────────────────────────────────
   Inline SVG: scrap pile
───────────────────────────────────────────── */
const ScrapPile = ({ w = 72 }) => (
  <svg width={w} height={w * 0.6} viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="42" rx="36" ry="6" fill="rgba(0,0,0,0.25)" />
    <rect x="10" y="26" width="18" height="7" rx="2" fill="#6b7280" transform="rotate(-18,10,26)" />
    <rect x="34" y="18" width="22" height="6" rx="2" fill="#9ca3af" transform="rotate(12,34,18)" />
    <rect x="28" y="30" width="14" height="5" rx="2" fill="#4b5563" transform="rotate(-6,28,30)" />
    <circle cx="18" cy="32" r="7" fill="#6b7280" />
    <circle cx="56" cy="28" r="9" fill="#4b5563" />
    <circle cx="40" cy="24" r="6" fill="#9ca3af" />
    <rect x="8" y="29" width="9" height="13" rx="1" fill="#374151" transform="rotate(-22,8,29)" />
  </svg>
)

/* ─────────────────────────────────────────────
   Marketplace hub SVG icon
───────────────────────────────────────────── */
const MarketplaceIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="19" cy="19" r="17" fill="#0d2d1c" stroke="#3ecf6e" strokeWidth="1.5" />
    <path d="M12 28 L19 10 L26 28" stroke="#3ecf6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="19" cy="10" r="3.5" fill="#3ecf6e" />
    <path d="M14 21 Q19 19 24 21" stroke="#3ecf6e" strokeWidth="1.5" fill="none" />
  </svg>
)

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function ComparisonSection() {
  const sectionRef = useRef(null)
  const [visible, setVisible]   = useState(false)
  const [entered, setEntered]   = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          // small delay so CSS transition sees the initial state first
          requestAnimationFrame(() => setTimeout(() => setEntered(true), 60))
          obs.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const CHAIN = [
    { label: 'Scrap Seller',     helmet: null,    vest: null,      top: false },
    { label: 'Kabadiwala',       helmet: null,    vest: null,      top: true  },
    { label: 'Local Dealer',     helmet: '#f59e0b', vest: null,    top: false },
    { label: 'Aggregator',       helmet: null,    vest: null,      top: true  },
    { label: 'Verified Recycler',helmet: '#f59e0b', vest: '#1b6b3a', top: false },
    { label: 'Scrap Buyer',      helmet: null,    vest: '#1b6b3a', top: true  },
  ]

  const BUYERS = [
    { name: 'Kabadiwala',        letter: 'K', hue: 150 },
    { name: 'Local Dealer',      letter: 'L', hue: 160 },
    { name: 'Aggregator',        letter: 'A', hue: 140 },
    { name: 'Verified Recycler', letter: 'V', hue: 170 },
  ]

  return (
    <section ref={sectionRef} className="cp-section">
      {/* ── header ── */}
      <div className={`cp-header ${entered ? 'cp-in' : ''}`}>
        <span className="cp-header-tag">Why ScrapBazaar</span>
        <h2 className="cp-header-title">The Scrap Market Is Changing.</h2>
        <p className="cp-header-sub">
          From offline deals and limited choices to a smarter way to discover, bid and trade scrap.
        </p>
      </div>

      {/* ── two panels ── */}
      <div className="cp-panels">

        {/* ════════════ LEFT: Traditional ════════════ */}
        <div className={`cp-panel cp-left ${entered ? 'cp-panel-in' : ''}`}>
          <div className="cp-panel-top">
            <span className="cp-tag cp-tag-bad">Traditional Way</span>
            <h3 className="cp-panel-title">Many hands.<br />Many cuts.</h3>
            <p className="cp-panel-desc">
              Your scrap passes through a chain of middlemen, and each one keeps a share.
            </p>
          </div>

          {/* staggered name labels */}
          <div className="cp-chain-labels">
            {CHAIN.map((p, i) => (
              <div
                key={i}
                className={`cp-clabel ${p.top ? 'cp-clabel--top' : 'cp-clabel--bot'} ${entered ? 'cp-clabel-in' : ''}`}
                style={{ '--delay': `${0.15 + i * 0.08}s` }}
              >
                {p.label}
              </div>
            ))}
          </div>

          {/* figures + cut badges */}
          <div className="cp-chain-row">
            {CHAIN.map((p, i) => (
              <React.Fragment key={i}>
                {/* person figure */}
                <div
                  className={`cp-figure ${entered ? 'cp-figure-in' : ''}`}
                  style={{
                    '--delay': `${0.2 + i * 0.1}s`,
                    '--float-dur': `${7 + (i % 3)}s`,
                    '--float-delay': `${i * 0.4}s`,
                  }}
                >
                  <Person
                    helmetColor={p.helmet}
                    vestColor={p.vest}
                    color={p.vest ? p.vest : '#475569'}
                    size={40}
                  />
                  {/* scrap pile under first / middle / last */}
                  {(i === 0 || i === 2 || i === 4) && (
                    <div className="cp-scrap"><ScrapPile w={i === 0 ? 60 : 44} /></div>
                  )}
                </div>

                {/* cut badge between figures */}
                {i < CHAIN.length - 1 && (
                  <div
                    className={`cp-cut ${entered ? 'cp-cut-in' : ''}`}
                    style={{ '--delay': `${0.5 + i * 0.12}s` }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 5h8M6 2l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Cut
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* animated red dashed line */}
          <div className="cp-dashes">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`cp-dash ${entered ? 'cp-dash-in' : ''}`}
                style={{ '--delay': `${0.8 + i * 0.04}s` }}
              />
            ))}
            <div className={`cp-dash-dot ${entered ? 'cp-dash-dot-in' : ''}`} style={{ '--delay': '1.6s' }} />
          </div>
        </div>

        {/* ════════════ VS badge ════════════ */}
        <div className="cp-vs-col">
          <div className={`cp-vs ${entered ? 'cp-vs-in' : ''}`}>
            <span>VS</span>
          </div>
        </div>

        {/* ════════════ RIGHT: ScrapBazaar ════════════ */}
        <div className={`cp-panel cp-right ${entered ? 'cp-panel-in cp-right-in' : ''}`}>
          <div className="cp-panel-top">
            <span className="cp-tag cp-tag-good">The ScrapBazaar Way</span>
            <h3 className="cp-panel-title">
              One Listing. Multiple Buyers.{' '}
              <span className="cp-green">Best Price.</span>
            </h3>
            <p className="cp-panel-desc">
              ScrapBazaar connects your scrap with verified buyers — from{' '}
              <strong>local dealers</strong> to <strong>large recyclers</strong> — through live
              bidding, so you always get the best value.
            </p>
          </div>

          {/* marketplace diagram */}
          <div className="cp-diagram">
            {/* seller figure */}
            <div className={`cp-dia-seller ${entered ? 'cp-dia-seller-in' : ''}`}>
              <div className="cp-dia-seller-figure">
                <Person vestColor="#1b6b3a" color="#1b6b3a" size={48} />
              </div>
              <div className="cp-you-tag">YOU</div>
              <div className="cp-dia-scrap"><ScrapPile w={56} /></div>
            </div>

            {/* listing card */}
            <div className={`cp-listing-card ${entered ? 'cp-listing-in' : ''}`}>
              <div className="cp-listing-head">
                <svg width="13" height="13" viewBox="0 0 14 16" fill="none">
                  <rect x="1" y="1" width="12" height="14" rx="2" stroke="#1b6b3a" strokeWidth="1.4" />
                  <path d="M4 5h6M4 8h6M4 11h4" stroke="#1b6b3a" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                List Scrap
              </div>
              {['Add details', 'Upload photos', 'Set quantity'].map((t, i) => (
                <div key={i} className="cp-listing-row">
                  <span className="cp-listing-check">✓</span>{t}
                </div>
              ))}
            </div>

            {/* marketplace hub */}
            <div className={`cp-hub ${entered ? 'cp-hub-in' : ''}`}>
              <div className="cp-hub-glow" />
              <div className="cp-hub-box">
                <MarketplaceIcon />
                <div className="cp-hub-name">SCRAPBAZAAR</div>
                <div className="cp-hub-sub">MARKETPLACE</div>
              </div>
              <div className="cp-live-pill">
                <span className="cp-live-dot" />
                Live Bidding
              </div>
            </div>

            {/* connection lines + buyer cards */}
            <div className="cp-buyers-wrap">
              {/* animated SVG connection lines */}
              <svg className="cp-conn-svg" viewBox="0 0 50 220" preserveAspectRatio="none">
                {BUYERS.map((_, i) => (
                  <line
                    key={i}
                    x1="0" y1="110"
                    x2="50" y2={27 + i * 55}
                    stroke="#3ecf6e"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    className={`cp-conn-line ${entered ? 'cp-conn-in' : ''}`}
                    style={{ '--delay': `${0.8 + i * 0.18}s` }}
                  />
                ))}
              </svg>

              <div className="cp-buyers-col">
                {BUYERS.map((b, i) => (
                  <div
                    key={i}
                    className={`cp-buyer ${entered ? 'cp-buyer-in' : ''}`}
                    style={{ '--delay': `${0.85 + i * 0.15}s` }}
                  >
                    <div className="cp-buyer-av" style={{ background: `hsl(${b.hue},45%,22%)` }}>
                      {b.letter}
                    </div>
                    <div className="cp-buyer-info">
                      <div className="cp-buyer-name">{b.name}</div>
                      <div className="cp-buyer-track">
                        <div
                          className={`cp-buyer-bar ${entered ? 'cp-buyer-bar-in' : ''}`}
                          style={{
                            '--bar-w': `${62 + i * 9}%`,
                            '--delay': `${1.1 + i * 0.15}s`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* process steps */}
          <div className="cp-steps">
            {[
              { emoji: '🏆', label: 'Best bid wins' },
              { emoji: '🚛', label: 'Pickup & weighment' },
              { emoji: '✅', label: 'Payment received' },
            ].map((s, i) => (
              <div
                key={i}
                className={`cp-step ${entered ? 'cp-step-in' : ''}`}
                style={{ '--delay': `${1.1 + i * 0.12}s` }}
              >
                <span>{s.emoji}</span> {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
