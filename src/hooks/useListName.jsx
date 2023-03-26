import { useEffect, useRef, useState } from "preact/hooks"

const MODE_VIEW = 0
const MODE_EDIT = 1

export default function useBoardName(name, renameList) {
  const [mode, setMode] = useState(MODE_VIEW)
  const inputRef = useRef()

  useEffect(() => {
    if (mode === MODE_EDIT) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [mode])

  function onClick(e) {
    e.preventDefault()
    setMode(MODE_EDIT)
  }

  async function onKeyUp(e) {
    switch (e.key) {
      case "Enter": {
        e.preventDefault()
        await renameList(name, e.target.value)
        setMode(MODE_VIEW)
        break
      }
      case "Escape": {
        e.preventDefault()
        setMode(MODE_VIEW)
        break
      }
    }
  }

  const nameView =
    mode === MODE_VIEW ? (
      <span onClick={(e) => setMode(MODE_EDIT)}>
        {name.replace(/\[\[([^\]]+)\]\]/g, "$1")}
      </span>
    ) : (
      <input
        ref={inputRef}
        type="text"
        size={16}
        onKeyUp={onKeyUp}
        onBlur={(e) => setMode(MODE_VIEW)}
        defaultValue={name}
      />
    )

  return nameView
}
