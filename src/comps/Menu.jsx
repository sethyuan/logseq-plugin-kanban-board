import { waitMs } from "jsutils"
import { useEffect, useRef } from "preact/hooks"
import { cls } from "reactutils"

export default function Menu({ x, y, children, onClose, className }) {
  const rootRef = useRef()

  useEffect(() => {
    rootRef.current.focus()
  }, [])

  function onKeyDown(e) {
    if (e.key === "Escape" && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  async function onBlur(e) {
    await waitMs(100)
    if (
      rootRef.current == null ||
      rootRef.current.contains(parent.document.activeElement)
    )
      return
    onClose()
  }

  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <div
      ref={rootRef}
      class={cls("kef-kb-menu", className)}
      tabIndex={-1}
      style={{ top: `${y}px`, left: `${x}px` }}
      onKeyDown={onKeyDown}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onBlur={onBlur}
    >
      {children}
    </div>
  )
}
