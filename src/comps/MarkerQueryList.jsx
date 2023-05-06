import { Droppable } from "../../deps/react-beautiful-dnd"
import KanbanCard from "./KanbanCard"

export default function MarkerQueryList({ name, blocks, width }) {
  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <div class="kef-kb-list">
      <div class="kef-kb-list-title">
        <div class="kef-kb-list-name" onMouseDown={stopPropagation}>
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
            style={width && { width }}
          >
            {blocks?.map((block, i) => (
              <KanbanCard
                key={block.id}
                block={block}
                listName={name}
                index={i}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
