import produce from "immer"
import { useCallback, useMemo } from "preact/hooks"
import { cls } from "reactutils"
import {
  DragDropContext,
  Droppable,
  useMouseSensor,
} from "../../deps/react-beautiful-dnd"
import useBoardName from "../hooks/useBoardName"
import useDragMove from "../hooks/useDragMove"
import useFilter from "../hooks/useFilter"
import { BoardContext } from "../libs/contexts"
import DropDown from "./DropDown"
import KanbanAddList from "./KanbanAddList"
import KanbanList from "./KanbanList"

export default function KanbanBoard({ board, property, coverProp }) {
  const { view, setView, renderFilterPopup } = useFilter(board)
  const { listRef, ...moveEvents } = useDragMove()
  const nameView = useBoardName(board.name, board.uuid)

  async function addList(name) {
    const content = `placeholder #.kboard-placeholder\n${property}:: ${name}`
    await logseq.Editor.insertBlock(board.uuid, content, { sibling: false })
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
    const card = view.lists[src.droppableId][src.index]
    const durationValue = updatedDurationValue(
      card,
      src.droppableId,
      dest.droppableId,
    )

    setView(
      produce(view, (draft) => {
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

    const block = view.lists[src.droppableId][src.index]

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
      const refBlock = view.lists[dest.droppableId][dest.index]
      if (src.index < dest.index) {
        await logseq.Editor.moveBlock(block.uuid, refBlock.uuid)
      } else {
        await logseq.Editor.moveBlock(block.uuid, refBlock.uuid, {
          before: true,
        })
      }
    } else {
      if (dest.index < view.lists[dest.droppableId].length) {
        const refBlock = view.lists[dest.droppableId][dest.index]
        await logseq.Editor.moveBlock(block.uuid, refBlock.uuid, {
          before: true,
        })
      } else {
        const refBlock = view.lists[dest.droppableId][dest.index - 1]
        await logseq.Editor.moveBlock(block.uuid, refBlock.uuid)
      }
    }
  }

  async function moveList(e) {
    const { source: src, destination: dest } = e
    const lists = view.lists

    const keys = Object.keys(lists)
    if (src.index < dest.index) {
      keys.splice(dest.index + 1, 0, keys[src.index])
      keys.splice(src.index, 1)
    } else {
      const key = keys.splice(src.index, 1)
      keys.splice(dest.index, 0, ...key)
    }
    setView({
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

  const addCard = useCallback(
    async (listName, text) => {
      const list = board.lists[listName]
      const refBlock = list[list.length - 1]
      const content = `${text}\n${property}:: ${listName}`
      await logseq.Editor.insertBlock(refBlock.uuid, content, {
        sibling: true,
        before: refBlock.content.includes(".kboard-placeholder"),
      })
    },
    [board],
  )

  const writeDuration = useCallback(async (block, listName) => {
    const value = updatedDurationValue(block, listName)
    await logseq.Editor.upsertBlockProperty(block.uuid, "duration", value)
  }, [])

  const renameList = useCallback(
    async (oldName, newName) => {
      await Promise.all(
        board.lists[oldName].map(async (block) => {
          await logseq.Editor.upsertBlockProperty(block.uuid, property, newName)
        }),
      )
      for (const list of Object.values(board.lists)) {
        await Promise.all(
          list.map(async (block) => {
            const durationData = JSON.parse(block.properties.duration)
            if (durationData[oldName] != null) {
              durationData[newName] = durationData[oldName]
              delete durationData[oldName]
              await logseq.Editor.upsertBlockProperty(
                block.uuid,
                "duration",
                JSON.stringify(durationData),
              )
            }
          }),
        )
      }
    },
    [board],
  )

  const contextValue = useMemo(
    () => ({
      listNames: Object.keys(board.lists),
      addCard,
      writeDuration,
      renameList,
      tagColors: board.configs.tagColors,
    }),
    [board],
  )

  function stopPropagation(e) {
    e.stopPropagation()
  }

  if (view?.lists == null) return null

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
              onMouseDown={stopPropagation}
            >
              <div class="kef-kb-board-name">
                {nameView}
                <DropDown
                  popup={renderFilterPopup}
                  popupClass="kef-kb-filter-menu"
                >
                  <span
                    class={cls(
                      "kef-kb-filter-icon",
                      Object.entries(view.lists).some(
                        ([name, list]) =>
                          list.length !== board.lists[name]?.length,
                      ) && "kef-kb-filter-on",
                    )}
                  >
                    &#xeaa5;
                  </span>
                </DropDown>
              </div>
              <div class="kef-kb-board-lists" ref={listRef} {...moveEvents}>
                {Object.entries(view.lists).map(([name, blocks], i) => (
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
                <KanbanAddList onAddList={addList} />
              </div>
            </div>
          )}
        </Droppable>
      </BoardContext.Provider>
    </DragDropContext>
  )
}
