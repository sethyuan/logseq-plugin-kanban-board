import produce from "immer"
import { useEffect, useMemo, useState } from "preact/hooks"
import {
  DragDropContext,
  Droppable,
  useMouseSensor,
} from "../../deps/react-beautiful-dnd"
import { BoardContext } from "../libs/contexts"
import KanbanList from "./KanbanList"

export default function KanbanBoard({ board, property, coverProp }) {
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
    const card = data.lists[src.droppableId][src.index]
    const durationValue = updatedDurationValue(
      card,
      src.droppableId,
      dest.droppableId,
    )

    setData(
      produce(data, (draft) => {
        if (src.droppableId === dest.droppableId && src.index < dest.index) {
          const card = draft.lists[src.droppableId][src.index]
          card.properties[property] = dest.droppableId
          card.properties.duration = durationValue
          draft.lists[dest.droppableId].splice(dest.index + 1, 0, card)
          draft.lists[src.droppableId].splice(src.index, 1)
        } else {
          const srcCard = draft.lists[src.droppableId].splice(src.index, 1)
          srcCard[0].properties[property] = dest.droppableId
          srcCard[0].properties.duration = durationValue
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
    await logseq.Editor.upsertBlockProperty(
      block.uuid,
      "duration",
      durationValue,
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

  function updatedDurationValue(block, from, to) {
    if (from.startsWith("[[")) {
      from = `{${from.substring(1)}`
    }
    if (to?.startsWith("[[")) {
      to = `{${to.substring(1)}`
    }
    const current = block.properties.duration
      ? JSON.parse(block.properties.duration)
      : {}
    const now = Date.now()
    const [srcAcc, last] = current[from] ?? [0, now]
    const [destAcc] = current[to] ?? [0]
    return JSON.stringify({
      ...current,
      [from]: [now - last + srcAcc, to ? 0 : now],
      ...(to ? { [to]: [destAcc, now] } : {}),
    })
  }

  const contextValue = useMemo(
    () => ({
      listNames: Object.keys(data.lists),

      async addCard(listName, text) {
        const list = data.lists[listName]
        const refBlock = list[list.length - 1]
        const content = `${text}\n${property}:: ${listName}`
        await logseq.Editor.insertBlock(refBlock.uuid, content, {
          sibling: true,
          before: refBlock.content.includes(".kboard-placeholder"),
        })
      },

      async writeDuration(block, listName) {
        const value = updatedDurationValue(block, listName)
        block.properties.duration = value
        await logseq.Editor.upsertBlockProperty(block.uuid, "duration", value)
      },
    }),
    [data],
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
              <div class="kef-kb-board-name">{data.name}</div>
              <div class="kef-kb-board-lists">
                {Object.entries(data.lists).map(([name, blocks], i) => (
                  <KanbanList
                    key={name}
                    name={name}
                    blocks={blocks}
                    property={property}
                    coverProp={coverProp}
                    index={i}
                  />
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </BoardContext.Provider>
    </DragDropContext>
  )
}
