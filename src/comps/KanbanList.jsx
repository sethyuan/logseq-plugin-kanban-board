import { Draggable, Droppable } from "react-beautiful-dnd"

export default function KanbanList({ name, blocks, property }) {
  return (
    <div class="kef-kb-list">
      <div class="kef-kb-list-name">{name}</div>
      <Droppable droppableId={`list-${name}`}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {blocks?.map((block, i) => (
              <Draggable
                key={block.id}
                draggableId={`card-${block.id}`}
                index={i}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <KanbanCard
                      key={block.id}
                      block={block}
                      property={property}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
