import { t } from "logseq-l10n"
import { useEffect, useRef, useState } from "preact/hooks"
import { useWaitedAction } from "reactutils"
import PlusIcon from "./PlusIcon"

const BUTTON = 1
const INPUT = 2

export default function KanbanAddList({ onAddList }) {
  const [mode, setMode] = useState(BUTTON)
  const inp = useRef()

  useEffect(() => {
    if (mode === INPUT) {
      inp.current.focus()
    }
  }, [mode])

  const { action: onAdd, duringAction: duringOnAdd } = useWaitedAction(
    async (e) => {
      e.preventDefault()
      e.stopPropagation()
      await onAddList(inp.current.value)
      setMode(BUTTON)
    },
  )

  function changeModeToInput(e) {
    setMode(INPUT)
  }

  function stopPropagation(e) {
    e.stopPropagation()
  }

  function onInputKeyDown(e) {
    e.stopPropagation()
    switch (e.key) {
      case "Escape":
        e.preventDefault()
        setMode(BUTTON)
        break
      case "Enter": {
        if (e.isComposing) return
        e.preventDefault()
        onAdd(e)
        break
      }
      default:
        break
    }
  }

  return (
    <form class="kef-kb-addlist" onSubmit={onAdd} onMouseDown={stopPropagation}>
      {mode === BUTTON ? (
        <button
          class="kef-kb-addone-addbtn"
          type="button"
          onClick={changeModeToInput}
        >
          <PlusIcon /> {t("Add new list")}
        </button>
      ) : (
        <>
          <textarea
            class="kef-kb-addone-input"
            ref={inp}
            onKeyDown={onInputKeyDown}
          />
          <div class="kef-kb-addone-btns">
            <button
              class="kef-kb-addone-btn"
              type="submit"
              disabled={duringOnAdd}
            >
              {t("OK")}
            </button>
            <button
              class="kef-kb-addone-btn"
              type="button"
              disabled={duringOnAdd}
              onClick={() => setMode(BUTTON)}
            >
              {t("Cancel")}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
