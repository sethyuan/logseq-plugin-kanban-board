import { useEffect, useState } from "preact/hooks"
import { Draggable } from "../../deps/react-beautiful-dnd"
import { parseContent } from "../libs/utils"

const HIDDEN_PROP_NAMES = new Set(["id", "heading", "collapsed"])

export default function KanbanCard({ block, property, index }) {
  const [data, setData] = useState()

  useEffect(() => {
    if (block == null) return
    ;(async () => {
      const [content, tags, properties] = await parseContent(block.content)
      setData({ content, tags, properties })
    })()
  }, [block])

  if (data == null) return null

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
          {properties?.length > 0 && (
            <div class="kef-kb-card-props">
              {properties.map(([name, value]) => (
                <>
                  <div class="kef-kb-card-props-key">{name}</div>
                  <div class="kef-kb-card-props-val">{value}</div>
                </>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
