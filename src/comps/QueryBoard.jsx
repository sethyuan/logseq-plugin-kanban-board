import produce from "immer"
import { useCallback, useMemo } from "preact/hooks"
import { cls } from "reactutils"
import { DragDropContext, useMouseSensor } from "../../deps/react-beautiful-dnd"
import useDragMove from "../hooks/useDragMove"
import useFilter from "../hooks/useFilter"
import { BoardContext } from "../libs/contexts"
import DropDown from "./DropDown"
import MarkerQueryList from "./MarkerQueryList"

export default function QueryBoard({ board, list, columnWidth, onRefresh }) {
  const { view, setView, renderFilterPopup } = useFilter(board)
  const { listRef, ...moveEvents } = useDragMove()

  function onDragEnd(e) {
    if (!e.destination) return
    if (e.source.droppableId === e.destination.droppableId) return

    switch (e.type) {
      case "CARD":
        moveCard(e)
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

  if (view?.lists == null) return null

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      enableDefaultSensors={false}
      sensors={[useMouseSensor]}
    >
      <BoardContext.Provider value={contextValue}>
        <div class="kef-kb-board" onMouseDown={stopPropagation}>
          <div class="kef-kb-board-name">
            {board.name}
            <DropDown popup={renderFilterPopup} popupClass="kef-kb-filter-menu">
              <span
                class={cls(
                  "kef-kb-board-icon",
                  Object.entries(view.lists).some(
                    ([name, list]) => list.length !== board.lists[name]?.length,
                  ) && "kef-kb-filter-on",
                )}
              >
                &#xeaa5;
              </span>
            </DropDown>
            <button type="button" class="kef-kb-board-icon" onClick={onRefresh}>
              &#xeb13;
            </button>
          </div>
          <div class="kef-kb-board-lists" ref={listRef} {...moveEvents}>
            {Object.keys(view.lists)
              .sort()
              .map((name) => (
                <MarkerQueryList
                  key={name}
                  name={name}
                  blocks={view.lists[name]}
                  width={columnWidth}
                />
              ))}
          </div>
        </div>
      </BoardContext.Provider>
    </DragDropContext>
  )
}
