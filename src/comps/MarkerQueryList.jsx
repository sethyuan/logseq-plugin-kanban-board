import { Droppable } from "../../deps/react-beautiful-dnd"
import KanbanCard from "./KanbanCard"

export default function MarkerQueryList({ name, blocks, width, coverProp }) {
  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <div class="kef-kb-list" style={width && { width }}>
      <div class="kef-kb-list-title" onMouseDown={stopPropagation}>
        <div class="kef-kb-list-name">
          {name.replace(/\[\[([^\]]+)\]\]/g, "$1")}
        </div>
        <div class="kef-kb-list-size">({blocks.length})</div>
      </div>

      <Droppable droppableId={name} type="CARD">
        {(provided, snapshot) => (
          <div
            class="kef-kb-list-cards"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {blocks?.map((block, i) => (
              <KanbanCard
                key={block.id}
                block={block}
                listName={name}
                index={i}
                coverProp={coverProp}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
