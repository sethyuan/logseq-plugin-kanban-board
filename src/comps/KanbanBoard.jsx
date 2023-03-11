import produce from "immer"
import { useEffect, useState } from "preact/hooks"
import { DragDropContext, Droppable } from "../../deps/react-beautiful-dnd"
import KanbanList from "./KanbanList"

export default function KanbanBoard({ board, property }) {
  const [data, setData] = useState(board)

  useEffect(() => {
    setData(board)
  }, [board])

  function onDragEnd(e) {
    console.log(e)

    if (!e.destination) return
    if (
      e.source.droppableId === e.destination.droppableId &&
      e.source.index === e.destination.index
    )
      return

    switch (e.type) {
      case "CARD":
        moveCard(e)
        break
      case "LIST":
        moveList(e)
        break
    }
  }

  async function moveCard(e) {
    const { source: src, destination: dest } = e

    setData(
      produce(data, (draft) => {
        if (src.droppableId === dest.droppableId && src.index < dest.index) {
          const card = draft.lists[src.droppableId][src.index]
          draft.lists[dest.droppableId].splice(dest.index + 1, 0, card)
          draft.lists[src.droppableId].splice(src.index, 1)
        } else {
          const srcCard = draft.lists[src.droppableId].splice(src.index, 1)
          draft.lists[dest.droppableId].splice(dest.index, 0, ...srcCard)
        }
      }),
    )

    const block = data.lists[src.droppableId][src.index]

    await logseq.Editor.upsertBlockProperty(
      block.uuid,
      property,
      dest.droppableId,
    )

    if (src.droppableId === dest.droppableId) {
      const refBlock = data.lists[dest.droppableId][dest.index]
      if (src.index < dest.index) {
        await logseq.Editor.moveBlock(block.uuid, refBlock.uuid)
      } else {
        await logseq.Editor.moveBlock(block.uuid, refBlock.uuid, {
          before: true,
        })
      }
    } else {
      if (dest.index < data.lists[dest.droppableId].length) {
        const refBlock = data.lists[dest.droppableId][dest.index]
        await logseq.Editor.moveBlock(block.uuid, refBlock.uuid, {
          before: true,
        })
      } else {
        const refBlock = data.lists[dest.droppableId][dest.index - 1]
        await logseq.Editor.moveBlock(block.uuid, refBlock.uuid)
      }
    }
  }

  async function moveList(e) {
    // TODO
  }

  if (data?.lists == null) return null

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" direction="horizontal" type="LIST">
        {(provided, snapshot) => (
          <div
            class="kef-kb-board"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {Object.entries(data.lists).map(([name, blocks], i) => (
              <KanbanList
                key={name}
                name={name}
                blocks={blocks}
                property={property}
                index={i}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
