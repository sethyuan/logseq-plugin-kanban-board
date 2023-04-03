import { t } from "logseq-l10n"
import { useEffect, useRef, useState } from "preact/hooks"
import KanbanArchived from "../comps/KanbanArchived"
import KanbanAutoArchive from "../comps/KanbanAutoArchive"

const MODE_NORMAL = 0
const MODE_ARCHIVED = 1
const MODE_AUTOARCHIVE = 2

export default function useMenu(board, property) {
  const [mode, setMode] = useState(MODE_NORMAL)
  const rootRef = useRef()

  useEffect(() => {
    rootRef.current?.focus()
  }, [mode])

  function renderMenu(hidePopup) {
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
            <button
              class="kef-kb-menu-item"
              onClick={(e) => setMode(MODE_AUTOARCHIVE)}
            >
              {t("Auto Archive Setting")}
            </button>
          </>
        )}
        {mode === MODE_ARCHIVED && (
          <KanbanArchived board={board} property={property} />
        )}
        {mode === MODE_AUTOARCHIVE && (
          <KanbanAutoArchive board={board} onClose={hidePopup} />
        )}
      </div>
    )
  }

  function resetMenuMode() {
    setMode(MODE_NORMAL)
  }

  return { renderMenu, resetMenuMode }
}
