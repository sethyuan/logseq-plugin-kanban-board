import { t } from "logseq-l10n"
import { useContext, useRef } from "preact/hooks"
import { BoardContext } from "../libs/contexts"

export default function KanbanAutoArchive({ board, onClose }) {
  const listRef = useRef()
  const durationRef = useRef()
  const { saveAutoArchiving } = useContext(BoardContext)

  async function onSave(e) {
    const durationValid = durationRef.current.checkValidity()
    if (!durationValid) {
      await logseq.UI.showMsg(t("Duration must be 1 or greater."), "error")
      return
    }
    const listName = listRef.current.value
    const duration = durationRef.current.value
    await saveAutoArchiving(listName, +duration)
    onClose()
  }

  async function onClear() {
    await saveAutoArchiving()
  }

  return (
    <>
      <p class="kef-kb-autoarchive-desc">
        {t(
          "Automatically archive the cards in the specified list, whose duration is bigger than the specified days.",
        )}
      </p>

      <div class="kef-kb-autoarchive-label">{t("List")}</div>
      <select
        ref={listRef}
        class="kef-kb-autoarchive-list"
        defaultValue={
          board.configs.autoArchiving?.list ?? Object.keys(board.lists)[0]
        }
      >
        {Object.keys(board.lists).map((listName, i) => (
          <option key={listName} value={listName} defaultChecked={i === 0}>
            {listName.replace(/\[\[([^\]]+)\]\]/g, "$1")}
          </option>
        ))}
      </select>

      <div class="kef-kb-autoarchive-label">{t("Duration")}</div>
      <div class="kef-kb-autoarchive-inputrow">
        <input
          ref={durationRef}
          class="kef-kb-autoarchive-input"
          type="number"
          defaultValue={board.configs.autoArchiving?.duration ?? 1}
          min={1}
        />
        <span class="kef-kb-autoarchive-suffix">{t("days")}</span>
      </div>

      <div class="kef-kb-autoarchive-btns">
        <button class="kef-kb-autoarchive-btn" onClick={onSave}>
          {t("Save and apply")}
        </button>
        <button class="kef-kb-autoarchive-btn" onClick={onClear}>
          {t("Clear and save")}
        </button>
      </div>
    </>
  )
}
