import { t } from "logseq-l10n"
import { useContext, useState } from "preact/hooks"
import { Draggable, Droppable } from "../../deps/react-beautiful-dnd"
import useListName from "../hooks/useListName"
import { BoardContext } from "../libs/contexts"
import KanbanAddCard from "./KanbanAddCard"
import KanbanCard from "./KanbanCard"
import Menu from "./Menu"

export default function KanbanList({
  name,
  blocks,
  property,
  coverProp,
  index,
}) {
  const { renameList, deleteList } = useContext(BoardContext)
  const nameView = useListName(name, renameList)
  const [menuData, setMenuData] = useState({ visible: false })

  function onMouseDown(e) {
    e.stopPropagation()
    if (e.button === 2) {
      e.preventDefault()
      setMenuData({
        visible: true,
        x: e.clientX,
        y: e.clientY,
      })
    }
  }

  function closeMenu() {
    setMenuData((old) => ({ ...old, visible: false }))
  }

  async function onDeleteList() {
    setMenuData((data) => ({
      ...data,
      visible: false,
    }))
    await deleteList(name)
  }

  return (
    <Draggable draggableId={name} index={index}>
      {(provided, snapshot) => (
        <div
          class="kef-kb-list"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div
            class="kef-kb-list-title"
            {...provided.dragHandleProps}
            onMouseDown={onMouseDown}
          >
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

          {menuData.visible && (
            <Menu x={menuData.x} y={menuData.y} onClose={closeMenu}>
              <button class="kef-kb-menu-item" onClick={onDeleteList}>
                {t("Delete list")}
              </button>
            </Menu>
          )}
        </div>
      )}
    </Draggable>
  )
}
