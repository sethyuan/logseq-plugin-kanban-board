import { createPortal } from "preact/compat"
import { cls } from "reactutils"

export default function Menu({ x, y, children, onClose, className }) {
  function overlayOnClick(e) {
    e.stopPropagation()
    e.preventDefault()
    onClose()
  }

  function onKeyDown(e) {
    if (e.key === "Escape" && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  function stopPropagation(e) {
    e.stopPropagation()
  }

  return createPortal(
    <div
      class="kef-kb-menu-overlay"
      onMouseDown={stopPropagation}
      onClick={overlayOnClick}
      onKeyDown={onKeyDown}
    >
      <div
        class={cls("kef-kb-menu", className)}
        style={{ top: `${y}px`, left: `${x}px` }}
        onClick={stopPropagation}
      >
        {children}
      </div>
    </div>,
    parent.document.getElementById("app-container"),
  )
}
