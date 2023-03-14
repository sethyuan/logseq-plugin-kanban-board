import { t } from "logseq-l10n"
import { useContext, useEffect, useRef, useState } from "preact/hooks"
import { useWaitedAction } from "reactutils"
import { BoardContext } from "../libs/contexts"
import PlusIcon from "./PlusIcon"

const BUTTON = 1
const INPUT = 2

export default function KanbanAddOne({ list }) {
  const [mode, setMode] = useState(BUTTON)
  const { addCard } = useContext(BoardContext)
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
      await addCard(list, inp.current.value)
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
        e.preventDefault()
        if (e.shiftKey) {
          const t = e.target
          t.setRangeText("\n", t.selectionStart, t.selectionEnd, "end")
        } else {
          onAdd(e)
        }
        break
      }
      default:
        break
    }
  }

  return (
    <form class="kef-kb-addone" onSubmit={onAdd} onMouseDown={stopPropagation}>
      {mode === BUTTON ? (
        <button class="kef-kb-addone-addbtn" onClick={changeModeToInput}>
          <PlusIcon /> {t("Add a card")}
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
