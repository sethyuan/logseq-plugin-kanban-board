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
    switch (e.key) {
      case "Escape":
        e.preventDefault()
        setMode(BUTTON)
        break
      case "Enter":
        e.preventDefault()
        onAdd(e)
        break
      default:
        break
    }
  }

  return (
    <form class="kef-kb-addone" onSubmit={onAdd} onMouseDown={stopPropagation}>
      {mode === BUTTON ? (
        <button class="kef-kb-addone-btn" onClick={changeModeToInput}>
          <PlusIcon /> {t("Add a card")}
        </button>
      ) : (
        <>
          <input class="kef-kb-addone-input" ref={inp} type="text" onKeyDown={onInputKeyDown} />
          <input
            class="kef-kb-addone-input-btn"
            type="submit"
            value={t("OK")}
            disabled={duringOnAdd}
          />
        </>
      )}
    </form>
  )
}
