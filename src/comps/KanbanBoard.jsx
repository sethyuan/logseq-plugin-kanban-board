import produce from "immer"
import { t } from "logseq-l10n"
import { useCallback, useEffect, useMemo, useState } from "preact/hooks"
import { debounce } from "rambdax"
import { cls, useCompositionChange } from "reactutils"
import {
  DragDropContext,
  Droppable,
  useMouseSensor,
} from "../../deps/react-beautiful-dnd"
import { BoardContext } from "../libs/contexts"
import DropDown from "./Dropdown"
import KanbanList from "./KanbanList"

const TAGOP_AND = 0
const TAGOP_OR = 1

const TagPredicates = [
  // OP_AND
  (filters, tags) => {
    for (const t of filters) {
      if (!tags.has(t)) return false
    }
    return true
  },

  // OP_OR
  (filters, tags) => {
    for (const t of filters) {
      if (tags.has(t)) return true
    }
    return false
  },
]

const PROPOP_INCLUDES = 0
const PROPOP_EQ = 1
const PROPOP_GT = 2
const PROPOP_GE = 3
const PROPOP_LT = 4
const PROPOP_LE = 5
const PROPOP_DATERANGE = 6

const PropPredicates = [
  (key, value, props) => {
    if (!key) return true
    for (const [pname, pvalue] of props) {
      if (pname === key && pvalue.toLowerCase().includes(value.toLowerCase())) {
        return true
      }
    }
    return false
  },
]

export default function KanbanBoard({ board, property, coverProp }) {
  const [data, setData] = useState(board)
  const [textFilter, setTextFilter] = useState("")
  const [tagsFilter, setTagsFilter] = useState(() => ({
    tags: [],
    op: TAGOP_AND,
  }))
  const [propsFilter, setPropsFilter] = useState([
    { key: "", op: PROPOP_INCLUDES, value: "" },
  ])
  const [view, setView] = useState(() => filterData(board))

  useEffect(() => {
    setData(board)
    setView(filterData(board))
  }, [board])

  useEffect(() => {
    setView(filterData(board))
  }, [textFilter, tagsFilter, propsFilter])

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

  function filterData(board) {
    return produce(board, (draft) => {
      for (const key of Object.keys(draft.lists)) {
        for (let i = draft.lists[key].length - 1; i >= 0; i--) {
          const card = board.lists[key][i]
          const placeholder = card.data.tags.has(".kboard-placeholder")
          const filterForText =
            textFilter.length > 0
              ? card.data.content
                  .toLowerCase()
                  .includes(textFilter.toLowerCase())
              : true
          const filterForTags =
            tagsFilter.tags.length > 0
              ? TagPredicates[tagsFilter.op](tagsFilter.tags, card.data.tags)
              : true
          const filterForProps = propsFilter.every(({ op, key, value }) =>
            PropPredicates[op](key, value, card.data.props),
          )
          if (
            !(filterForText && filterForTags && filterForProps) &&
            !placeholder
          ) {
            draft.lists[key].splice(i, 1)
          }
        }
      }
    })
  }

  const changeTextFilter = useCallback(
    debounce((e) => {
      console.log(e.target.value)
      setTextFilter(e.target.value)
    }, 200),
    [],
  )
  const textFilterChangeProps = useCompositionChange(changeTextFilter)

  function onTagOpChange(e) {
    setTagsFilter((old) => ({
      ...old,
      op: +e.target.value,
    }))
  }

  function onTagCheckChange(e) {
    if (e.target.checked) {
      setTagsFilter((old) =>
        produce(old, (draft) => {
          draft.tags.push(e.target.name)
        }),
      )
    } else {
      setTagsFilter((old) =>
        produce(old, (draft) => {
          const index = old.tags.indexOf(e.target.name)
          if (index > -1) {
            draft.tags.splice(index, 1)
          }
        }),
      )
    }
  }

  function addPropFilter(e) {
    setPropsFilter((old) =>
      produce(old, (draft) => {
        draft.push({
          op: PROPOP_INCLUDES,
          key: "",
          value: "",
        })
      }),
    )
  }

  function removePropFilter(e, i) {
    setPropsFilter((old) =>
      produce(old, (draft) => {
        draft.splice(i, 1)
      }),
    )
  }

  const changePropKey = useCallback(
    debounce((e, i) => {
      setPropsFilter((old) =>
        produce(old, (draft) => {
          draft[i].key = e.target.value
        }),
      )
    }, 200),
    [],
  )
  const propKeyChangeProps = useCompositionChange(changePropKey)

  const changePropValue = useCallback(
    debounce((e, i) => {
      setPropsFilter((old) =>
        produce(old, (draft) => {
          draft[i].value = e.target.value
        }),
      )
    }),
    [],
  )
  const propValueChangeProps = useCompositionChange(changePropValue)

  function resetFilter(e) {
    setTextFilter("")
    setTagsFilter({ tags: [], op: TAGOP_AND })
    setPropsFilter([{ key: "", op: PROPOP_INCLUDES, value: "" }])
  }

  function renderFilterPopup() {
    return (
      <div class="kef-kb-filter-popup">
        <div class="kef-kb-filter-label">{t("Keyword")}</div>
        <input
          class="kef-kb-filter-input"
          type="text"
          value={textFilter}
          {...textFilterChangeProps}
        />

        <div class="kef-kb-filter-label">{t("Tags")}</div>
        <select
          class="kef-kb-filter-select"
          value={tagsFilter.op}
          onChange={onTagOpChange}
        >
          <option value={TAGOP_AND}>{t("Exact match")}</option>
          <option value={TAGOP_OR}>{t("Any match")}</option>
        </select>
        {Array.from(view.tags).map((tag) => (
          <label key={tag} class="kef-kb-filter-checkbox">
            <input
              type="checkbox"
              name={tag}
              checked={tagsFilter.tags.includes(tag)}
              onChange={onTagCheckChange}
            />
            <span>{tag}</span>
          </label>
        ))}

        <div class="kef-kb-filter-label">{t("Properties")}</div>
        {propsFilter.map((propFilter, i) => (
          <div key={i} class="kef-kb-filter-prop-row">
            <button
              class="kef-kb-filter-prop-remove"
              onClick={(e) => removePropFilter(e, i)}
            >
              &#xea68;
            </button>
            <input
              class="kef-kb-filter-prop-key"
              type="text"
              placeholder={t("name")}
              value={propFilter.key}
              onChange={(e) => propKeyChangeProps.onChange(e, i)}
              onCompositionStart={propKeyChangeProps.onCompositionStart}
              onCompositionEnd={(e) =>
                propKeyChangeProps.onCompositionEnd(e, i)
              }
            />
            <span>:</span>
            <input
              class="kef-kb-filter-prop-value"
              type="text"
              placeholder={t("keyword")}
              size="1"
              value={propFilter.value}
              onChange={(e) => propValueChangeProps.onChange(e, i)}
              onCompositionStart={propValueChangeProps.onCompositionStart}
              onCompositionEnd={(e) =>
                propValueChangeProps.onCompositionEnd(e, i)
              }
            />
          </div>
        ))}
        <button class="kef-kb-filter-prop-add" onClick={addPropFilter}>
          &#xeb0b;
        </button>

        <button class="kef-kb-filter-reset" onClick={resetFilter}>
          {t("Reset")}
        </button>
      </div>
    )
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
        await logseq.Editor.upsertBlockProperty(block.uuid, "duration", value)
      },
    }),
    [data],
  )

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
            >
              <div class="kef-kb-board-name">
                <span>{view.name}</span>
                <DropDown
                  popup={renderFilterPopup}
                  popupClass="kef-kb-filter-menu"
                >
                  <span
                    class={cls(
                      "kef-kb-filter-icon",
                      (textFilter.length > 0 || tagsFilter.tags.length > 0) &&
                        "kef-kb-filter-on",
                    )}
                  >
                    &#xeaa5;
                  </span>
                </DropDown>
              </div>
              <div class="kef-kb-board-lists">
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
              </div>
            </div>
          )}
        </Droppable>
      </BoardContext.Provider>
    </DragDropContext>
  )
}
