/**
 * HowItWorks — animated pin-card steps with a flowing dashed connector line.
 * Adapted from the original TypeScript/Tailwind version to plain JS + CSS vars.
 *
 * Props:
 *   sellerSteps  Array<{ step, title, desc }>  — seller how-it-works steps
 *   buyerSteps   Array<{ step, title, desc }>  — buyer how-it-works steps
 *   className    string
 */

import React from 'react'
import { LazyMotion, domAnimation, m } from 'motion/react'

/* ─── injected CSS ─── */
const CSS = `
.hiw-root {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}
.hiw-grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(var(--border-light) 1px, transparent 1px);
  background-size: 100% 32px;
  margin-top: 4px;
  opacity: 0.45;
}
[data-theme="dark"] .hiw-grid-overlay { opacity: 0.15; }

.hiw-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 2;
}

/* Two-column layout header */
.hiw-header {
  text-align: center;
  margin-bottom: 56px;
}

/* Columns wrapper */
.hiw-columns {
  display: grid;
  grid-template-columns: 1fr 56px 1fr;
  gap: 0;
  align-items: start;
}
@media (max-width: 900px) {
  .hiw-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .hiw-divider-col { display: none; }
}

/* ─── Pin icon ─── */
.hiw-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

/* ─── Step card ─── */
.hiw-card-wrap {
  width: 100%;
  transition: transform 0.3s ease, z-index 0s;
  position: relative;
}
.hiw-card-wrap:hover {
  transform: scale(1.04);
  z-index: 10;
}
.hiw-card-outer {
  background: var(--bg-card);
  padding: 10px;
  border-radius: 22px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
}
.hiw-card-inner {
  border-radius: 14px;
  padding: 18px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* colour themes */
.hiw-card-inner.theme-green  { background: var(--brand-light);     border: 1px solid var(--green-200); }
.hiw-card-inner.theme-amber  { background: #FFFBEB;                  border: 1px solid #FDE68A; }
.hiw-card-inner.theme-blue   { background: #EFF6FF;                  border: 1px solid #BFDBFE; }
[data-theme="dark"] .hiw-card-inner.theme-green { background: rgba(27,107,58,.12); border-color: rgba(27,107,58,.25); }
[data-theme="dark"] .hiw-card-inner.theme-amber { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.2); }
[data-theme="dark"] .hiw-card-inner.theme-blue  { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.2); }

.hiw-step-num {
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 10px;
  font-family: "Comic Sans MS", "Chalkboard SE", cursive;
}
.hiw-step-num.green { color: var(--brand-primary); }
.hiw-step-num.amber { color: var(--amber-600, #D97706); }
.hiw-step-num.blue  { color: #2563EB; }
[data-theme="dark"] .hiw-step-num.blue { color: #60A5FA; }

.hiw-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.25;
}
.hiw-card-desc {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* ─── Steps column ─── */
.hiw-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.hiw-col-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 8px;
}
.hiw-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.hiw-role-badge.seller {
  background: var(--brand-light);
  color: var(--brand-primary);
  border: 1px solid var(--green-200);
}
.hiw-role-badge.buyer {
  background: #FFFBEB;
  color: var(--amber-600, #D97706);
  border: 1px solid #FDE68A;
}
[data-theme="dark"] .hiw-role-badge.buyer {
  background: rgba(245,158,11,.1);
  border-color: rgba(245,158,11,.2);
}
.hiw-col-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.hiw-col-cta {
  margin-top: 4px;
}

/* ─── Centre divider ─── */
.hiw-divider-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 72px;
  gap: 0;
  height: 100%;
}
.hiw-divider-line {
  flex: 1;
  width: 1px;
  background: var(--border-medium);
  min-height: 40px;
}
.hiw-divider-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ─── SVG connector (desktop only) ─── */
.hiw-connector {
  display: none;
}
@media (min-width: 901px) {
  .hiw-connector {
    display: block;
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
    z-index: 1;
  }
  .hiw-col-with-connector {
    position: relative;
  }
}
`

let cssInjected = false
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return
  cssInjected = true
  const el = document.createElement('style')
  el.textContent = CSS
  document.head.appendChild(el)
}

/* ─── Pin SVG ─── */
function Pin({ color = 'currentColor', size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
    </svg>
  )
}

/* theme cycling per column */
const SELLER_THEMES = ['green', 'amber', 'blue', 'green', 'amber']
const BUYER_THEMES  = ['amber', 'blue', 'green', 'amber', 'blue']

const PIN_COLORS = {
  green: 'var(--brand-primary)',
  amber: 'var(--amber-600, #D97706)',
  blue:  '#2563EB',
}

/* ─── Single step card ─── */
function StepCard({ stepNum, title, desc, theme = 'green', delay = 0 }) {
  return (
    <m.div
      className="hiw-card-wrap"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hiw-card-outer">
        <div className="hiw-pin">
          <Pin color={PIN_COLORS[theme]} size={26} />
        </div>
        <div className={`hiw-card-inner theme-${theme}`}>
          <span className={`hiw-step-num ${theme}`}>{stepNum}</span>
          <h4 className="hiw-card-title">{title}</h4>
          <p className="hiw-card-desc">{desc}</p>
        </div>
      </div>
    </m.div>
  )
}

/* ─── Main component ─── */
export default function HowItWorks({
  sellerSteps = [],
  buyerSteps  = [],
  className   = '',
}) {
  injectCSS()

  return (
    <LazyMotion features={domAnimation}>
      <div className={`hiw-root ${className}`}>
        <div className="hiw-grid-overlay" aria-hidden="true" />

        <div className="hiw-inner">
          <div className="hiw-columns">

            {/* ── Seller column ── */}
            <div className="hiw-col">
              <div className="hiw-col-header">
                <div className="hiw-role-badge seller">
                  {/* factory icon inline */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M3 7v14M3 7l9-4 9 4M9 21v-6h6v6"/>
                  </svg>
                  Scrap Seller
                </div>
                <h3 className="hiw-col-title">List. Get Bids. Get Paid.</h3>
              </div>

              {sellerSteps.map((s, i) => (
                <StepCard
                  key={i}
                  stepNum={`0${i + 1}`}
                  title={s.title}
                  desc={s.desc}
                  theme={SELLER_THEMES[i % SELLER_THEMES.length]}
                  delay={i * 0.08}
                />
              ))}

              <div className="hiw-col-cta">
                <a href="/sellers" className="btn btn-secondary">
                  Learn More for Sellers →
                </a>
              </div>
            </div>

            {/* ── Centre divider ── */}
            <div className="hiw-divider-col" aria-hidden="true">
              <div className="hiw-divider-line" />
              <div className="hiw-divider-icon">
                {/* scale icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18M6 6l-3 6h6zM18 6l-3 6h6z"/>
                  <line x1="3" y1="21" x2="21" y2="21"/>
                </svg>
              </div>
              <div className="hiw-divider-line" />
            </div>

            {/* ── Buyer column ── */}
            <div className="hiw-col">
              <div className="hiw-col-header">
                <div className="hiw-role-badge buyer">
                  {/* truck icon inline */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  Scrap Buyer
                </div>
                <h3 className="hiw-col-title">Browse. Bid. Buy with Confidence.</h3>
              </div>

              {buyerSteps.map((s, i) => (
                <StepCard
                  key={i}
                  stepNum={`0${i + 1}`}
                  title={s.title}
                  desc={s.desc}
                  theme={BUYER_THEMES[i % BUYER_THEMES.length]}
                  delay={i * 0.08 + 0.12}
                />
              ))}

              <div className="hiw-col-cta">
                <a href="/buyers" className="btn btn-amber">
                  Learn More for Buyers →
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </LazyMotion>
  )
}
