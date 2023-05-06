import produce from "immer"
import { useCallback, useMemo } from "preact/hooks"
import { cls } from "reactutils"
import { DragDropContext, useMouseSensor } from "../../deps/react-beautiful-dnd"
import useDragMove from "../hooks/useDragMove"
import useFilter from "../hooks/useFilter"
import { BoardContext } from "../libs/contexts"
import DropDown from "./DropDown"
import MarkerQueryList from "./MarkerQueryList"

export default function MarkerQueryBoard({ board, columnWidth, onRefresh }) {
  const { view, setView, renderFilterPopup } = useFilter(board)
  const { listRef, ...moveEvents } = useDragMove()

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
    if (e.source.droppableId === e.destination.droppableId) return

    switch (e.type) {
      case "CARD":
        moveCard(e)
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
        const srcCard = draft.lists[src.droppableId].splice(src.index, 1)
        srcCard[0].properties.duration = durationValue
        draft.lists[dest.droppableId].splice(dest.index, 0, ...srcCard)
      }),
    )

    const block = view.lists[src.droppableId][src.index]

    await logseq.Editor.updateBlock(
      block.uuid,
      `${dest.droppableId}${block.content.substring(src.droppableId.length)}`,
    )
    await logseq.Editor.upsertBlockProperty(
      block.uuid,
      "duration",
      durationValue,
    )
  }

  const writeDuration = useCallback(async (block, listName) => {
    const value = updatedDurationValue(block, listName)
    await logseq.Editor.upsertBlockProperty(block.uuid, "duration", value)
  }, [])

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
            {Object.entries(view.lists).map(([name, blocks]) => (
              <MarkerQueryList
                key={name}
                name={name}
                blocks={blocks}
                width={columnWidth}
              />
            ))}
          </div>
        </div>
      </BoardContext.Provider>
    </DragDropContext>
  )
}
