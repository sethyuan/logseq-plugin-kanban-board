import { useRef, useState } from "preact/hooks"
import Menu from "./Menu"

export default function DropDown({ children, popup, popupClass, ...attrs }) {
  const [popupShown, setPopupShown] = useState(false)
  const root = useRef()
  const [pos, setPos] = useState()

  function showPopup(e) {
    setPopupShown(true)
    const boardRect = root.current
      .closest(".kef-kb-board")
      .getBoundingClientRect()
    const rect = root.current.getBoundingClientRect()
    setPos({
      x: rect.x - boardRect.x,
      y: rect.y - boardRect.y + rect.height + 6,
    })
  }

  function hidePopup(e) {
    setPopupShown(false)
  }

  function toggleVisibility(e) {
    if (popupShown) {
      hidePopup()
    } else {
      showPopup()
    }
  }

  return (
    <span ref={root} {...attrs} onClick={toggleVisibility}>
      {children}
      {popupShown && (
        <Menu className={popupClass} x={pos.x} y={pos.y} onClose={hidePopup}>
          {popup()}
        </Menu>
      )}
    </span>
  )
}
