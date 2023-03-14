import { t } from "logseq-l10n"
import { useEffect, useState } from "preact/hooks"
import { Draggable } from "../../deps/react-beautiful-dnd"
import { parseContent, persistBlockUUID } from "../libs/utils"
import Menu from "./Menu"

const HIDDEN_PROP_NAMES = new Set(["id", "heading", "collapsed"])

export default function KanbanCard({ block, property, index }) {
  const [data, setData] = useState()
  const [menuData, setMenuData] = useState({ visible: false })

  useEffect(() => {
    if (block == null) return
    ;(async () => {
      const [content, tags, properties, scheduled, deadline] =
        await parseContent(block.content)
      setData({ content, tags, properties, scheduled, deadline })
    })()
  }, [block])

  if (data == null || data.tags.some((tag) => tag === ".kboard-placeholder"))
    return null

  function openBlock() {
    logseq.Editor.openInRightSidebar(block.uuid)
  }

  async function openTag(e, name) {
    e.stopPropagation()
    const tagUUID = (await logseq.Editor.getPage(name))?.uuid
    if (tagUUID) {
      logseq.Editor.openInRightSidebar(tagUUID)
    }
  }

  function onMouseDown(e) {
    e.stopPropagation()
    if (e.button === 2) {
      e.preventDefault()
      setMenuData({
        visible: true,
        x: e.clientX,
        y: e.clientY,
      })
    }
  }

  function closeMenu() {
    setMenuData((old) => ({ ...old, visible: false }))
  }

  async function copyRef() {
    setMenuData((data) => ({
      ...data,
      visible: false,
    }))
    await persistBlockUUID(block.uuid)
    await parent.navigator.clipboard.writeText(`((${block.uuid}))`)
    await logseq.UI.showMsg(t("Copied."))
  }

  async function copyEmbed() {
    setMenuData((data) => ({
      ...data,
      visible: false,
    }))
    await persistBlockUUID(block.uuid)
    await parent.navigator.clipboard.writeText(`{{embed ((${block.uuid}))}}`)
    await logseq.UI.showMsg(t("Copied."))
  }

  async function deleteCard() {
    setMenuData((data) => ({
      ...data,
      visible: false,
    }))
    await logseq.Editor.removeBlock(block.uuid)
    await logseq.UI.showMsg(t("Deleted."))
  }

  const properties = data.properties?.filter(
    ([name]) => name !== property && !HIDDEN_PROP_NAMES.has(name),
  )

  return (
    <Draggable draggableId={`${block.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          class="kef-kb-card"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={openBlock}
          onMouseDown={onMouseDown}
        >
          <div class="kef-kb-card-content">{data.content}</div>
          <div class="kef-kb-card-tags">
            {data.tags.map((tag) => (
              <div
                key={tag}
                class="kef-kb-card-tag"
                onClick={(e) => openTag(e, tag)}
              >
                {tag}
              </div>
            ))}
          </div>
          {(properties?.length > 0 || data.scheduled || data.deadline) && (
            <div class="kef-kb-card-props">
              {properties.map(([name, value]) => (
                <>
                  <div class="kef-kb-card-props-key">{name}</div>
                  <div class="kef-kb-card-props-val">{value}</div>
                </>
              ))}
              {data.scheduled && (
                <>
                  <div class="kef-kb-card-props-key">{t("scheduled")}</div>
                  <div class="kef-kb-card-props-val">{data.scheduled}</div>
                </>
              )}
              {data.deadline && (
                <>
                  <div class="kef-kb-card-props-key">{t("deadline")}</div>
                  <div class="kef-kb-card-props-val">{data.deadline}</div>
                </>
              )}
            </div>
          )}

          {menuData.visible && (
            <Menu x={menuData.x} y={menuData.y} onClose={closeMenu}>
              <button class="kef-kb-card-menu-item" onClick={copyRef}>
                {t("Copy reference")}
              </button>
              <button class="kef-kb-card-menu-item" onClick={copyEmbed}>
                {t("Copy as embed")}
              </button>
              <button class="kef-kb-card-menu-item" onClick={deleteCard}>
                {t("Delete")}
              </button>
            </Menu>
          )}
        </div>
      )}
    </Draggable>
  )
}
