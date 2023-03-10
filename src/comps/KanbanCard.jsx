import { useEffect, useState } from "preact/hooks"
import { parseContent } from "../libs/utils"

export default function KanbanCard({ block, property }) {
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

  const properties = data.properties?.filter(([name]) => name !== property)

  return (
    <div class="kef-kb-card" onClick={openBlock}>
      <div class="kef-kb-card-content">{data.content}</div>
      <div class="kef-kb-card-tags">
        {data.tags.map((tag) => (
          <div key={tag} class="kef-kb-card-tag">
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
  )
}
