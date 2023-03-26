import { useContext } from "preact/hooks"
import { Draggable, Droppable } from "../../deps/react-beautiful-dnd"
import useListName from "../hooks/useListName"
import { BoardContext } from "../libs/contexts"
import KanbanAddCard from "./KanbanAddCard"
import KanbanCard from "./KanbanCard"

export default function KanbanList({
  name,
  blocks,
  property,
  coverProp,
  index,
}) {
  const { renameList } = useContext(BoardContext)
  const nameView = useListName(name, renameList)

  return (
    <Draggable draggableId={name} index={index}>
      {(provided, snapshot) => (
        <div
          class="kef-kb-list"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div class="kef-kb-list-title" {...provided.dragHandleProps}>
            <div class="kef-kb-list-name">{nameView}</div>
            <div class="kef-kb-list-size">({blocks.length - 1})</div>
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

          <KanbanAddCard list={name} />
        </div>
      )}
    </Draggable>
  )
}
