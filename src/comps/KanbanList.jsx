import { Draggable, Droppable } from "../../deps/react-beautiful-dnd"
import KanbanAddOne from "./KanbanAddOne"
import KanbanCard from "./KanbanCard"

export default function KanbanList({
  name,
  blocks,
  property,
  coverProp,
  index,
}) {
  return (
    <Draggable draggableId={name} index={index}>
      {(provided, snapshot) => (
        <div
          class="kef-kb-list"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div class="kef-kb-list-name" {...provided.dragHandleProps}>
            <span>{name.replace(/\[\[([^\]]+)\]\]/g, "$1")}</span>
            <span class="kef-kb-list-size">({blocks.length - 1})</span>
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
                    coverProp={coverProp}
                    index={i}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <KanbanAddOne list={name} />
        </div>
      )}
    </Draggable>
  )
}
