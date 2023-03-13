import { createPortal } from "react-dom"

export default function Menu({ x, y, children, onClose }) {
  function overlayOnClick(e) {
    e.stopPropagation()
    e.preventDefault()
    onClose()
  }

  function menuOnClick(e) {
    e.stopPropagation()
    e.preventDefault()
  }

  return createPortal(
    <div
      class="kef-kb-menu-overlay"
      onMouseDown={menuOnClick}
      onClick={overlayOnClick}
    >
      <div
        class="kef-kb-menu"
        style={{ top: `${y}px`, left: `${x}px` }}
        onClick={menuOnClick}
      >
        {children}
      </div>
    </div>,
    parent.document.getElementById("main-content-container"),
  )
}
