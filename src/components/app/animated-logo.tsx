"use client"

import { useEffect, useRef } from "react"

// ─── AnimatedLogo ──────────────────────────────────────────────────────────────
// 3D carousel of M·U·Z·A spheres.
// Click left/right to spin. Mouse moves tilt. Idles into a gentle auto-wobble.
// `size` sets the CSS --mal-size variable (layout box = size×size px).

interface AnimatedLogoProps {
  size?: number
  className?: string
  /** Ambient mode: auto-rotates immediately, all interactions disabled */
  ambient?: boolean
}

export function AnimatedLogo({ size = 240, className, ambient = false }: AnimatedLogoProps) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const carouselRef    = useRef<HTMLDivElement>(null)
  const tiltWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container   = containerRef.current
    const carousel    = carouselRef.current
    const tiltWrapper = tiltWrapperRef.current
    if (!container || !carousel || !tiltWrapper) return

    // ── rotation state ────────────────────────────────────────────────────────
    let currdeg        = 0
    let isRotating     = false
    let isSpinningFast = false
    let autoRotate     = ambient  // ambient: start rotating immediately
    let lastInteraction = ambient ? -Infinity : Date.now()
    let rafId: number

    const IDLE_DELAY  = 800

    // ── auto-rotation wobble ──────────────────────────────────────────────────
    let autoRotatePaused     = false
    let autoRotationOffset   = 0
    let autoRotationDir      = 1
    let autoRotationSpeed    = 0
    const MAX_AUTO_ROT_SPEED = 0.02

    // ── tilt ──────────────────────────────────────────────────────────────────
    const MAX_TILT_X = 44
    const MAX_TILT_Y = 14
    const TILT_EASE  = 0.35
    let targetTiltX  = 0, targetTiltY = 0
    let tiltX        = 0, tiltY       = 0

    // ── helpers ───────────────────────────────────────────────────────────────
    const getItems        = () => Array.from(carousel.querySelectorAll<HTMLElement>(".mal-item"))
    const getItemWrappers = () => Array.from(carousel.querySelectorAll<HTMLElement>(".mal-item-wrapper"))
    const toTransform     = (deg: number) => `rotateY(${deg}deg)`

    function updateDepthEffects() {
      getItemWrappers().forEach((el, i) => {
        const angle = (currdeg + i * 90) % 360
        const zPos  = Math.cos(angle * (Math.PI / 180))
        const item  = el.querySelector<HTMLElement>(".mal-item")
        if (!item) return

        if (!isSpinningFast && Math.abs(angle) < 15) item.classList.add("mal-front-item")
        else                                          item.classList.remove("mal-front-item")

        item.style.filter  = isSpinningFast && zPos < 0 ? `blur(${Math.abs(zPos) * 8}px)` : "blur(0px)"
        item.style.opacity = zPos < -0.5 && isSpinningFast ? "0.85" : "1"
      })
    }

    function resetAutoRotation() {
      autoRotatePaused   = true
      autoRotationOffset = 0
      autoRotationDir    = 1
      autoRotationSpeed  = 0
      setTimeout(() => {
        lastInteraction = Date.now() - IDLE_DELAY + 50
        autoRotatePaused = false
      }, 300)
    }

    function registerInteraction() {
      lastInteraction   = Date.now()
      autoRotate        = false
      autoRotationSpeed = 0
    }

    function rotate(dir: "p" | "n") {
      if (isRotating) return
      isRotating     = true
      isSpinningFast = true
      autoRotate     = false

      const items = getItems()
      items.forEach(item => item.classList.add("mal-squash"))

      setTimeout(() => {
        currdeg += dir === "n" ? 450 : -450
        carousel.classList.add("mal-rotate-transition")
        carousel.style.transform = toTransform(currdeg)
        updateDepthEffects()
      }, 30)

      setTimeout(() => {
        items.forEach(item => { item.classList.remove("mal-squash"); item.classList.add("mal-blow-up") })
      }, 200)

      setTimeout(() => {
        isSpinningFast = false
        updateDepthEffects()
        items.forEach(item => { item.classList.remove("mal-blow-up"); item.classList.add("mal-snap-back") })
        setTimeout(() => {
          items.forEach(item => item.classList.remove("mal-snap-back"))
          isRotating = false
          carousel.classList.remove("mal-rotate-transition")
          resetAutoRotation()
        }, 450)
      }, 1000)
    }

    function updateAutoRotation() {
      if (!isRotating && Date.now() - lastInteraction > IDLE_DELAY && !autoRotatePaused) {
        autoRotate = true
      }
      if (autoRotate && !isRotating && !autoRotatePaused) {
        if (autoRotationSpeed < MAX_AUTO_ROT_SPEED) autoRotationSpeed += 0.0002
        autoRotationOffset += autoRotationDir * autoRotationSpeed
        if (autoRotationOffset > 30 || autoRotationOffset < -30) autoRotationDir *= -1
        carousel.style.transform = toTransform(currdeg + autoRotationOffset)
        updateDepthEffects()
      }
    }

    function updateMagnetEffect(mx: number, my: number) {
      const inner = container.querySelector<HTMLElement>(".mal-front-item .mal-item-inner")
      if (!inner || isSpinningFast) return

      const rect     = inner.getBoundingClientRect()
      const cx       = rect.left + rect.width  / 2
      const cy       = rect.top  + rect.height / 2
      const dx       = mx - cx
      const dy       = my - cy
      const dist     = Math.sqrt(dx * dx + dy * dy)
      const radius   = 300

      if (dist < radius) {
        const force = 1 - dist / radius
        const scale = 1 - 0.2 * force
        const tx    = -dx * force * 0.5
        const ty    = -dy * force * 0.5
        inner.style.transform = `scale(${scale.toFixed(3)}) translate(${tx}px, ${ty}px)`
      } else {
        inner.style.transform = "scale(1)"
      }
    }

    // ── event handlers ────────────────────────────────────────────────────────
    const onClickContainer = (e: MouseEvent) => {
      rotate(e.clientX < window.innerWidth / 2 ? "p" : "n")
      registerInteraction()
    }

    const onMouseMove = (e: MouseEvent) => {
      const xr = (e.clientX / window.innerWidth)  - 0.5
      const yr = (e.clientY / window.innerHeight) - 0.5
      targetTiltX = yr * MAX_TILT_X
      targetTiltY = xr * MAX_TILT_Y
      registerInteraction()
      updateMagnetEffect(e.clientX, e.clientY)
    }

    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget || (e.relatedTarget as Element).nodeName === "HTML") {
        targetTiltX = 0
        targetTiltY = 0
      }
    }

    // ── RAF loop ──────────────────────────────────────────────────────────────
    function frame() {
      tiltX += (targetTiltX - tiltX) * TILT_EASE
      tiltY += (targetTiltY - tiltY) * TILT_EASE
      tiltWrapper.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`

      updateAutoRotation()
      rafId = requestAnimationFrame(frame)
    }

    frame()
    if (!ambient) {
      container.addEventListener("click",  onClickContainer)
      window.addEventListener("mousemove", onMouseMove, { passive: true })
      window.addEventListener("mouseout",  onMouseOut,  { passive: true })
    }

    return () => {
      cancelAnimationFrame(rafId)
      if (!ambient) {
        container.removeEventListener("click",  onClickContainer)
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("mouseout",  onMouseOut)
      }
    }
  }, [ambient])

  return (
    <div
      ref={containerRef}
      className={`mal-root select-none ${ambient ? "" : "cursor-pointer"} ${className ?? ""}`}
      style={{ "--mal-size": `${size}px` } as React.CSSProperties}
    >
      <div className="mal-container">
        <div ref={tiltWrapperRef} className="mal-tilt-wrapper">
          <div ref={carouselRef} className="mal-carousel">
            {(["M", "U", "Z", "A"] as const).map((letter) => (
              <div key={letter} className="mal-item-wrapper">
                <div className="mal-item">
                  <div className="mal-item-inner">{letter}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
