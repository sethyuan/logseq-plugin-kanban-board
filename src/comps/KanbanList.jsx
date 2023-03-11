import { Draggable, Droppable } from "../../deps/react-beautiful-dnd"
import KanbanCard from "./KanbanCard"

export default function KanbanList({ name, blocks, property, index }) {
  return (
    <Draggable draggableId={name} index={index}>
      {(provided, snapshot) => (
        <div
          class="kef-kb-list"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div class="kef-kb-list-name" {...provided.dragHandleProps}>
            {name.replace(/\[\[([^\]]+)\]\]/g, "$1")}
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
                    property={property}
                    index={i}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  )
}
