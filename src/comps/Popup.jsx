import { createPortal } from "preact/compat"
import { useRef, useState } from "preact/hooks"

export default function Popup({ children, popup, ...attrs }) {
  const [popupShown, setPopupShown] = useState(false)
  const root = useRef()
  const [pos, setPos] = useState()

  function showPopup(e) {
    setPopupShown(true)
    const rect = root.current.getBoundingClientRect()
    setPos({
      x: `${rect.x + rect.width + 10}px`,
      y: `${rect.y + rect.height}px`,
    })
  }

  function hidePopup(e) {
    setPopupShown(false)
  }

  return (
    <span
      ref={root}
      {...attrs}
      onPointerEnter={showPopup}
      onPointerLeave={hidePopup}
    >
      {children}
      {popupShown &&
        createPortal(
          <div class="kef-kb-popup" style={{ top: pos.y, left: pos.x }}>
            {popup()}
          </div>,
          parent.document.getElementById("app-container"),
        )}
    </span>
  )
}
