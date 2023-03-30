import { t } from "logseq-l10n"
import { useEffect, useRef, useState } from "preact/hooks"
import KanbanArchived from "../comps/KanbanArchived"

const MODE_NORMAL = 0
const MODE_ARCHIVED = 1

export default function useMenu(board, property) {
  const [mode, setMode] = useState(MODE_NORMAL)
  const rootRef = useRef()

  useEffect(() => {
    rootRef.current?.focus()
  }, [mode])

  function renderMenu() {
    return (
      <div ref={rootRef} class="kef-kb-menu-popup" tabIndex={-1}>
        {mode === MODE_NORMAL && (
          <>
            <button
              class="kef-kb-menu-item"
              onClick={(e) => setMode(MODE_ARCHIVED)}
            >
              {t("Archived")}
            </button>
          </>
        )}
        {mode === MODE_ARCHIVED && (
          <KanbanArchived board={board} property={property} />
        )}
      </div>
    )
  }

  function resetMenuMode() {
    setMode(MODE_NORMAL)
  }

  return { renderMenu, resetMenuMode }
}
