import { formatDistance } from "date-fns"
import { t } from "logseq-l10n"
import { useContext, useEffect, useRef, useState } from "preact/hooks"
import { Draggable } from "../../deps/react-beautiful-dnd"
import { BoardContext } from "../libs/contexts"
import { parseContent, persistBlockUUID } from "../libs/utils"
import Menu from "./Menu"
import Popup from "./Popup"

const HIDDEN_PROP_NAMES = new Set([
  "id",
  "heading",
  "collapsed",
  "duration",
  "archived",
  "scroll-top",
])

export default function KanbanCard({
  block: data,
  property,
  listName,
  index,
  coverProp,
  canArchive = false,
}) {
  const [block, setBlock] = useState(data)
  const rootRef = useRef()
  const [menuData, setMenuData] = useState({ visible: false })
  const {
    listNames,
    writeDuration,
    tagColors,
    deleteCard,
    archiveCard,
    onRefresh,
  } = useContext(BoardContext)

  useEffect(() => {
    setBlock(data)
  }, [data])

  useEffect(() => {
    // Listen only for query boards.
    if (block == null || listName == null) return
    const off = logseq.DB.onBlockChanged(block.uuid, async () => {
      if (rootRef.current == null || !rootRef.current.isConnected) {
        off()
        return
      }
      const updated = await logseq.Editor.getBlock(block.uuid)
      if (updated == null || updated.marker !== block.marker) {
        onRefresh()
      } else {
        const [content, tags, props, cover, scheduled, deadline] =
          await parseContent(updated.content, coverProp)
        updated.data = {
          content,
          tags,
          props,
          cover,
          scheduled,
          deadline,
        }
        setBlock(updated)
      }
    })
    return off
  }, [block])

  useEffect(() => {
    if (block == null) return
    ;(async () => {
      if (noDuration(block, listName ?? block.properties[property])) {
        await writeDuration(block, listName ?? block.properties[property])
      }
    })()
  }, [block])

  if (block.data.tags.has(".kboard-placeholder")) return null

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
      const boardRect = e.target
        .closest(".kef-kb-board")
        .getBoundingClientRect()
      setMenuData({
        visible: true,
        x: e.clientX - boardRect.x,
        y: e.clientY - boardRect.y,
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

  async function onDeleteCard() {
    setMenuData((data) => ({
      ...data,
      visible: false,
    }))
    await deleteCard(block.uuid)
  }

  async function onArchiveCard() {
    setMenuData((data) => ({
      ...data,
      visible: false,
    }))
    await archiveCard(block.uuid)
  }

  function renderDuration() {
    if (block.properties?.duration == null) return null
    try {
      const durationData = JSON.parse(block.properties.duration)
      return (
        <div class="kef-kb-card-duration-popup">
          {listNames
            .map((list) => {
              const isPage = list.startsWith("[[")
              const durationListData =
                durationData[isPage ? `{${list.substring(1)}` : list]
              if (durationListData == null) return null
              const [acc, last] = durationListData
              const nowTs = Date.now()
              const now = new Date(nowTs + acc)
              const backThen = last === 0 ? new Date(nowTs) : new Date(last)
              return (
                <>
                  <span class="kef-kb-card-duration-popup-l">
                    {isPage ? list.substring(2, list.length - 2) : list}
                  </span>
                  <span class="kef-kb-card-duration-popup-v">
                    {formatDistance(now, backThen)}
                  </span>
                </>
              )
            })
            .filter((x) => x != null)}
        </div>
      )
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const properties = block.data.props?.filter(
    ([name]) => name !== property && !HIDDEN_PROP_NAMES.has(name),
  )

  function renderPropValue(value) {
    const pattern = /\[\[([^\]]+)\]\]|#\[\[([^\]]+)\]\]|#(\S+)/g
    const ret = []
    let match
    let last = 0
    while ((match = pattern.exec(value)) != null) {
      ret.push(value.substring(last, match.index))
      const pageName = match[1] ?? match[2] ?? match[3]
      ret.push(<a onClick={(e) => openTag(e, pageName)}>{pageName}</a>)
      last = pattern.lastIndex
    }
    ret.push(value.substring(last))
    return ret
  }

  return (
    <Draggable draggableId={`${block.id}-${listName}`} index={index}>
      {(provided, snapshot) => (
        <div
          class="kef-kb-card"
          ref={(el) => {
            provided.innerRef(el)
            rootRef.current = el
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={openBlock}
          onMouseDown={onMouseDown}
        >
          {block.data.cover && (
            <img class="kef-kb-card-cover" src={block.data.cover} />
          )}
          <div class="kef-kb-card-content">
            <span>{block.data.content}</span>
            {block.properties?.duration != null && (
              <Popup popup={renderDuration}>
                <span class="kef-kb-card-duration">&#xf319;</span>
              </Popup>
            )}
          </div>
          <div class="kef-kb-card-tags">
            {Array.from(block.data.tags).map((tag) => (
              <div
                key={tag}
                class="kef-kb-card-tag"
                style={
                  tagColors[tag]
                    ? { backgroundColor: `#${tagColors[tag]}` }
                    : null
                }
                onClick={(e) => openTag(e, tag)}
              >
                {tag}
              </div>
            ))}
          </div>
          {(properties?.length > 0 ||
            block.data.scheduled ||
            block.data.deadline) && (
            <div class="kef-kb-card-props">
              {properties.map(([name, value]) => (
                <>
                  <div class="kef-kb-card-props-key">{name}</div>
                  <div class="kef-kb-card-props-val">
                    {renderPropValue(value)}
                  </div>
                </>
              ))}
              {block.data.scheduled && (
                <>
                  <div class="kef-kb-card-props-key">{t("scheduled")}</div>
                  <div class="kef-kb-card-props-val">
                    {block.data.scheduled}
                  </div>
                </>
              )}
              {block.data.deadline && (
                <>
                  <div class="kef-kb-card-props-key">{t("deadline")}</div>
                  <div class="kef-kb-card-props-val">{block.data.deadline}</div>
                </>
              )}
            </div>
          )}

          {menuData.visible && (
            <Menu x={menuData.x} y={menuData.y} onClose={closeMenu}>
              <button class="kef-kb-menu-item" onClick={copyRef}>
                {t("Copy reference")}
              </button>
              <button class="kef-kb-menu-item" onClick={copyEmbed}>
                {t("Copy as embed")}
              </button>
              <button class="kef-kb-menu-item" onClick={onDeleteCard}>
                {t("Delete card")}
              </button>
              {canArchive && (
                <button class="kef-kb-menu-item" onClick={onArchiveCard}>
                  {t("Archive card")}
                </button>
              )}
            </Menu>
          )}
        </div>
      )}
    </Draggable>
  )
}

function noDuration(block, listName) {
  if (!block.properties?.duration) return true
  const duration = JSON.parse(block.properties.duration)
  if (listName.startsWith("[[")) {
    listName = `{${listName.substring(1)}`
  }
  return !duration[listName]
}
