import { DragDropContext } from "react-beautiful-dnd"
import KanbanList from "./KanbanList"

export default function KanbanBoard({ data, property }) {
  console.log(data, property)

  if (data?.lists == null) return null

  function onDragEnd(e) {
    // TODO
  }

  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <div class="kef-kb-board" onMouseDown={stopPropagation}>
      <DragDropContext
        onBeforeDragStart={(e) => {
          console.log(e)
        }}
        onDragEnd={onDragEnd}
      >
        {Object.entries(data.lists).map(([name, blocks]) => (
          <KanbanList
            key={name}
            name={name}
            blocks={blocks}
            property={property}
          />
        ))}
      </DragDropContext>
    </div>
  )
}
