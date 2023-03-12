import produce from "immer"
import { useEffect, useMemo, useState } from "preact/hooks"
import {
  DragDropContext,
  Droppable,
  useMouseSensor,
} from "../../deps/react-beautiful-dnd"
import { BoardContext } from "../libs/contexts"
import KanbanList from "./KanbanList"

export default function KanbanBoard({ board, property }) {
  const [data, setData] = useState(board)

  useEffect(() => {
    setData(board)
  }, [board])

  function onDragEnd(e) {
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
    const { source: src, destination: dest } = e
    const lists = data.lists

    const keys = Object.keys(lists)
    if (src.index < dest.index) {
      keys.splice(dest.index + 1, 0, keys[src.index])
      keys.splice(src.index, 1)
    } else {
      const key = keys.splice(src.index, 1)
      keys.splice(dest.index, 0, ...key)
    }
    setData({
      lists: keys.reduce((obj, key) => {
        obj[key] = lists[key]
        return obj
      }, {}),
    })

    const ks = Object.keys(lists)
    const srcBlock = lists[ks[src.index]][0]
    if (src.index < dest.index) {
      for (let i = src.index + 1; i <= dest.index; i++) {
        const destBlock = lists[ks[i]][0]
        await logseq.Editor.moveBlock(destBlock.uuid, srcBlock.uuid, {
          before: true,
        })
      }
    } else {
      const destBlock = lists[ks[dest.index]][0]
      await logseq.Editor.moveBlock(srcBlock.uuid, destBlock.uuid, {
        before: true,
      })
    }
  }

  const contextValue = useMemo(
    () => ({
      async addCard(listName, text) {
        const list = data.lists[listName]
        const refBlock = list[list.length - 1]
        const content = `${text}\n${property}:: ${listName}`
        await logseq.Editor.insertBlock(refBlock.uuid, content, {
          sibling: true,
        })
      },
    }),
    [],
  )

  if (data?.lists == null) return null

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      enableDefaultSensors={false}
      sensors={[useMouseSensor]}
    >
      <BoardContext.Provider value={contextValue}>
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
      </BoardContext.Provider>
    </DragDropContext>
  )
}
