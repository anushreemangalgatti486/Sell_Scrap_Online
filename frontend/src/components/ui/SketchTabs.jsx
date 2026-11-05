/**
 * SketchTabs — animated rough-underline tabs using @radix-ui/react-tabs + roughjs.
 *
 * Usage:
 *   <SketchTabs
 *     tabs={[
 *       { value: 'overview', label: 'Overview', icon: <LayoutDashboard size={15}/> },
 *       { value: 'users',    label: 'Users',    icon: <Users size={15}/> },
 *     ]}
 *     value={currentTab}
 *     onValueChange={setCurrentTab}
 *   >
 *     <SketchTabPanel value="overview">...</SketchTabPanel>
 *     <SketchTabPanel value="users">...</SketchTabPanel>
 *   </SketchTabs>
 *
 * Or use as a header-only bar (no panels):
 *   <SketchTabs tabs={tabs} value={v} onValueChange={setV} panelless />
 */

import React, {
  createContext, useContext, useEffect, useLayoutEffect,
  useRef, useState,
} from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import rough from 'roughjs'

/* ─── design tokens pulled from global CSS variables ─── */
const CSS = `
.sk-tabs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  position: relative;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 0;
}
.sk-tab-trigger {
  position: relative;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 9px 16px 13px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 7px;
  transition: color 0.18s ease;
  outline: none;
  white-space: nowrap;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  letter-spacing: 0.01em;
}
.sk-tab-trigger:hover { color: var(--text-primary); background: var(--bg-secondary); }
.sk-tab-trigger[data-state="active"] {
  color: var(--brand-primary);
  font-weight: 600;
}
.sk-tab-trigger:focus-visible {
  box-shadow: inset 0 0 0 2px var(--brand-primary);
  border-radius: var(--radius-sm);
}
.sk-underline {
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 12px;
  pointer-events: none;
  overflow: visible;
  transition: left 200ms cubic-bezier(.4,0,.2,1), width 200ms cubic-bezier(.4,0,.2,1);
}
.sk-underline svg {
  overflow: visible;
  display: block;
}
.sk-tab-panel {
  outline: none;
  padding-top: 16px;
}

/* draw-in animation for the underline path */
@keyframes sk-draw {
  from { stroke-dashoffset: var(--sk-len); }
  to   { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .sk-underline { transition: none; }
  @keyframes sk-draw { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 0; } }
}
`

/* ─── roughjs underline ─── */
function drawRoughLine(canvas, w, seed, color, strokeWidth = 2.1) {
  if (!canvas || w <= 0) return
  const rc = rough.canvas(canvas)
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  rc.line(2, 4, w - 2, 4, {
    roughness: 1.6,
    seed,
    stroke: color,
    strokeWidth,
    bowing: 1.8,
  })
}

/* paint an SVG rough line and animate stroke-dasharray draw-in */
function RoughUnderline({ width, seed, color, animate }) {
  const svgRef = useRef(null)
  const drawnSeed = useRef(null)

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg || width <= 0) return

    // use roughjs's SVG generator
    const rs = rough.svg(svg)
    // clear previous
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    const node = rs.line(2, 4, width - 2, 4, {
      roughness: 1.6,
      seed,
      stroke: color,
      strokeWidth: 2.2,
      bowing: 1.8,
    })
    svg.appendChild(node)

    // animate draw-in when seed changes (new tab selected)
    if (animate && drawnSeed.current !== seed) {
      drawnSeed.current = seed
      const paths = svg.querySelectorAll('path, line')
      paths.forEach(p => {
        const len = p.getTotalLength ? p.getTotalLength() : width
        p.style.strokeDasharray = len
        p.style.strokeDashoffset = len
        p.style.animation = 'none'
        // force reflow
        void p.getBoundingClientRect()
        p.style.animation = `sk-draw 320ms ease forwards`
        p.style.setProperty('--sk-len', len)
      })
    }
  }, [width, seed, color, animate])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={12}
      aria-hidden="true"
      style={{ overflow: 'visible', display: 'block' }}
    />
  )
}

/* ─── context ─── */
const SketchCtx = createContext(null)

/* ─── inject CSS once ─── */
let cssInjected = false
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return
  cssInjected = true
  const el = document.createElement('style')
  el.textContent = CSS
  document.head.appendChild(el)
}

/* ─── main component ─── */
/**
 * @param {{ tabs, value, onValueChange, children, panelless, className, style }} props
 * tabs: Array<{ value: string, label: string, icon?: ReactNode }>
 * panelless: true → only render the tab bar (no TabsPrimitive.Content wrappers)
 */
export function SketchTabs({
  tabs = [],
  value,
  onValueChange,
  defaultValue,
  children,
  panelless = false,
  className = '',
  style,
}) {
  injectCSS()
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value)
  const current = value ?? internal

  const listRef = useRef(null)
  const [underline, setUnderline] = useState(null)
  const [animSeed, setAnimSeed] = useState(1)
  const prevTab = useRef(current)

  // measure position of active tab for underline
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const active = list.querySelector('[data-state="active"]')
      if (!active) { setUnderline(null); return }
      const PAD = 10
      setUnderline({
        left: active.offsetLeft + PAD,
        width: Math.max(12, active.offsetWidth - PAD * 2),
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [current, tabs])

  // bump seed to trigger draw-in animation on tab change
  useEffect(() => {
    if (prevTab.current !== current) {
      prevTab.current = current
      setAnimSeed(s => s + 1)
    }
  }, [current])

  // accent colour
  const accent = 'var(--brand-primary, #1B6B3A)'

  const handleChange = (v) => {
    setInternal(v)
    onValueChange?.(v)
  }

  return (
    <SketchCtx.Provider value={{ current }}>
      <TabsPrimitive.Root
        value={current}
        onValueChange={handleChange}
        className={className}
        style={style}
      >
        {/* Tab list */}
        <TabsPrimitive.List
          ref={listRef}
          className="sk-tabs-list"
          aria-label="Page sections"
        >
          {tabs.map(tab => (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              className="sk-tab-trigger"
            >
              {tab.icon && tab.icon}
              {tab.label}
            </TabsPrimitive.Trigger>
          ))}

          {/* Animated sketch underline */}
          {underline && (
            <span
              className="sk-underline"
              style={{ left: underline.left, width: underline.width }}
              aria-hidden="true"
            >
              <RoughUnderline
                width={underline.width}
                seed={animSeed}
                color={accent}
                animate={true}
              />
            </span>
          )}
        </TabsPrimitive.List>

        {/* Panels (only when not panelless) */}
        {!panelless && children}
      </TabsPrimitive.Root>
    </SketchCtx.Provider>
  )
}

/**
 * Wrap page content in this when using SketchTabs with panels.
 */
export function SketchTabPanel({ value, children, className = '', style }) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={`sk-tab-panel ${className}`}
      style={style}
    >
      {children}
    </TabsPrimitive.Content>
  )
}

export default SketchTabs
