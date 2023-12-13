import { Draggable, Droppable } from "../../deps/react-beautiful-dnd"
import KanbanCard from "./KanbanCard"

export default function QueryList({
  name,
  blocks,
  property,
  width,
  index,
  coverProp,
  canMoveList,
}) {
  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <Draggable draggableId={name} index={index} isDragDisabled={!canMoveList}>
      {(provided, snapshot) => (
        <div
          class="kef-kb-list"
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={
            width
              ? { ...provided.draggableProps.style, width }
              : provided.draggableProps.style
          }
        >
          <div
            class="kef-kb-list-title"
            {...provided.dragHandleProps}
            onMouseDown={stopPropagation}
          >
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
                    property={property}
                    coverProp={coverProp}
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
