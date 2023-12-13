import { t } from "logseq-l10n"
import { useContext } from "preact/hooks"
import { Draggable, Droppable } from "../../deps/react-beautiful-dnd"
import useListName from "../hooks/useListName"
import { BoardContext } from "../libs/contexts"
import DropDown from "./DropDown"
import KanbanAddCard from "./KanbanAddCard"
import KanbanCard from "./KanbanCard"

export default function KanbanList({
  name,
  blocks,
  property,
  index,
  width,
  coverProp,
}) {
  const { renameList, deleteList, archiveList } = useContext(BoardContext)
  const nameView = useListName(name, renameList)

  async function onDeleteList() {
    await deleteList(name)
  }

  async function onArchiveList() {
    await archiveList(name)
  }

  function stopPropagation(e) {
    e.stopPropagation()
  }

  function renderMenu() {
    return (
      <>
        <button class="kef-kb-menu-item" onClick={onDeleteList}>
          {t("Delete list")}
        </button>
        <button class="kef-kb-menu-item" onClick={onArchiveList}>
          {t("Archive list")}
        </button>
      </>
    )
  }

  return (
    <Draggable draggableId={name} index={index}>
      {(provided, snapshot) => (
        <div
          class="kef-kb-list"
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={
            width
              ? { ...provided.draggableProps.style, width }
              : provided.draggableProps.style
          }
        >
          <div
            class="kef-kb-list-title"
            {...provided.dragHandleProps}
            onMouseDown={stopPropagation}
          >
            <div class="kef-kb-list-name">{nameView}</div>
            <div class="kef-kb-list-size">({blocks.length - 1})</div>
            <div class="kef-kb-list-expander" />
            <DropDown popup={renderMenu}>
              <button type="button" class="kef-kb-list-menuicon">
                &#xea94;
              </button>
            </DropDown>
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
                    listName={name}
                    index={i}
                    canArchive
                    coverProp={coverProp}
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
