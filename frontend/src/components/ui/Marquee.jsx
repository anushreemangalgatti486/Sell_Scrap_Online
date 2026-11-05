/**
 * Marquee — infinite horizontal scroll ticker.
 *
 * Props:
 *   speed        number   seconds to complete one full scroll cycle (default 30)
 *   direction    "left" | "right"  (default "left")
 *   pauseOnHover boolean  pause animation when hovered (default false)
 *   gap          string   CSS gap between items (default "0px")
 *   className    string
 *   style        object
 *   children     ReactNode  — items to scroll; duplicated internally
 */

import React from 'react'

const CSS = `
@keyframes marquee-left  { to { transform: translateX(-50%); } }
@keyframes marquee-right { to { transform: translateX(0%); } from { transform: translateX(-50%); } }

.marquee-root {
  width: 100%;
  overflow: hidden;
  position: relative;
}
.marquee-track {
  display: flex;
  width: max-content;
  will-change: transform;
}
.marquee-track[data-dir="left"]  {
  animation: marquee-left  var(--mq-duration, 30s) linear infinite;
}
.marquee-track[data-dir="right"] {
  animation: marquee-right var(--mq-duration, 30s) linear infinite;
}
.marquee-track[data-pause="true"]:hover {
  animation-play-state: paused;
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

export function Marquee({
  children,
  speed = 30,
  direction = 'left',
  pauseOnHover = false,
  gap = '0px',
  className = '',
  style,
}) {
  injectCSS()

  return (
    <div className={`marquee-root ${className}`} style={style} aria-hidden="true">
      <div
        className="marquee-track"
        data-dir={direction}
        data-pause={String(pauseOnHover)}
        style={{
          '--mq-duration': `${speed}s`,
          gap,
        }}
      >
        {/* Duplicate children so the loop is seamless */}
        {children}
        {children}
      </div>
    </div>
  )
}

export default Marquee
