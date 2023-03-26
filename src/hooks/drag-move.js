import { useCallback, useRef } from "preact/hooks"

const MOVE_THRESHOLD = 10

export default function useDragMove() {
  const listRef = useRef()
  const dragStart = useRef()
  const scrollLeftStart = useRef()

  const onMouseDown = useCallback((e) => {
    // Drag move is not allowed in the list name region.
    for (let i = 0; i < 2; i++) {
      if (e.path[i].classList.contains("kef-kb-list-name")) {
        return
      }
    }
    dragStart.current = e.x
    scrollLeftStart.current = listRef.current.scrollLeft
  }, [])

  const onMouseUp = useCallback((e) => {
    dragStart.current = undefined
  }, [])

  const onMouseLeave = useCallback((e) => {
    dragStart.current = undefined
  }, [])

  const onMouseMove = useCallback((e) => {
    const xstart = dragStart.current
    if (xstart == null || Math.abs(e.x - xstart) < MOVE_THRESHOLD) return
    listRef.current.scrollLeft = scrollLeftStart.current - (e.x - xstart)
  }, [])

  return {
    listRef,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onMouseLeave,
  }
}
