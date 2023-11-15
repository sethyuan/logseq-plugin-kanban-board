import { useEffect, useRef, useState } from "preact/hooks"

const MODE_VIEW = 0
const MODE_EDIT = 1

export default function useBoardName(name, uuid) {
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
        const block = await logseq.Editor.getBlock(uuid)
        await logseq.Editor.updateBlock(
          uuid,
          block.content.replace(name, e.target.value),
        )
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
      <span class="kef-kb-board-name-label" onClick={(e) => setMode(MODE_EDIT)}>
        {name}
      </span>
    ) : (
      <input
        ref={inputRef}
        class="kef-kb-board-name-input"
        type="text"
        onKeyUp={onKeyUp}
        onBlur={(e) => setMode(MODE_VIEW)}
        defaultValue={name}
      />
    )

  return nameView
}
