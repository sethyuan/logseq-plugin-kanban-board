import produce from "immer"
import { useCallback, useMemo } from "preact/hooks"
import { cls } from "reactutils"
import {
  DragDropContext,
  Droppable,
  useMouseSensor,
} from "../../deps/react-beautiful-dnd"
import useDragMove from "../hooks/useDragMove"
import useFilter from "../hooks/useFilter"
import { BoardContext } from "../libs/contexts"
import DropDown from "./DropDown"
import QueryList from "./QueryList"

export default function QueryBoard({ board, list, columnWidth, onRefresh }) {
  const { view, setView, renderFilterPopup } = useFilter(board)
  const { listRef, ...moveEvents } = useDragMove()

  function onDragEnd(e) {
    if (!e.destination) return
    if (e.source.droppableId === e.destination.droppableId && e.type === "CARD")
      return
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

    setView(
      produce(view, (draft) => {
        const srcCard = draft.lists[src.droppableId].splice(src.index, 1)
        draft.lists[dest.droppableId].splice(dest.index, 0, ...srcCard)
      }),
    )

    const block = view.lists[src.droppableId][src.index]
    const listValue = block.properties[list].slice()
    if (Array.isArray(listValue)) {
      let indexToRemove = -1
      let hasDestList = false
      for (let i = 0; i < listValue.length; i++) {
        const value = `[[${listValue[i]}]]`
        if (value === src.droppableId) {
          indexToRemove = i
        } else if (value === dest.droppableId) {
          hasDestList = true
        }
        listValue[i] = value
      }
      if (indexToRemove > -1) {
        listValue.splice(indexToRemove, 1)
      }
      if (!hasDestList) {
        listValue.push(dest.droppableId)
      }
      const lines = block.content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`${list}:: `)) {
          lines[i] = `${list}:: ${listValue.join(",")}`
        }
      }
      await logseq.Editor.updateBlock(block.uuid, lines.join("\n"))
    } else {
      await logseq.Editor.upsertBlockProperty(
        block.uuid,
        list,
        dest.droppableId,
      )
    }
    onRefresh()
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

    await logseq.Editor.upsertBlockProperty(
      board.uuid,
      "configs",
      JSON.stringify({
        ...board.configs,
        listOrders: keys,
      }),
    )
  }

  const writeDuration = useCallback(async (block, listName) => {}, [])

  const deleteCard = useCallback(async (uuid) => {
    await logseq.Editor.removeBlock(uuid)
  }, [])

  const contextValue = useMemo(
    () => ({
      listNames: Object.keys(board.lists),
      writeDuration,
      deleteCard,
      onRefresh,
      tagColors: board.configs.tagColors,
    }),
    [board, onRefresh],
  )

  function stopPropagation(e) {
    e.stopPropagation()
  }

  function onEdit(e) {
    logseq.Editor.editBlock(board.uuid)
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
                {board.name}
                <DropDown
                  popup={renderFilterPopup}
                  popupClass="kef-kb-filter-menu"
                >
                  <span
                    class={cls(
                      "kef-kb-board-icon",
                      Object.entries(view.lists).some(
                        ([name, list]) =>
                          list.length !== board.lists[name]?.length,
                      ) && "kef-kb-filter-on",
                    )}
                  >
                    &#xeaa5;
                  </span>
                </DropDown>
                <button
                  type="button"
                  class="kef-kb-board-icon"
                  onClick={onRefresh}
                >
                  &#xeb13;
                </button>
                <button
                  type="button"
                  class="kef-kb-board-icon"
                  onClick={onEdit}
                >
                  &#xeb04;
                </button>
              </div>
              <div class="kef-kb-board-lists" ref={listRef} {...moveEvents}>
                {Object.keys(view.lists).map((name, i) => (
                  <QueryList
                    key={name}
                    name={name}
                    blocks={view.lists[name]}
                    width={columnWidth}
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
