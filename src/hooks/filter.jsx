import produce from "immer"
import { t } from "logseq-l10n"
import { useCallback, useEffect, useState } from "preact/hooks"
import { debounce } from "rambdax"
import { useCompositionChange } from "reactutils"

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

export default function useFilter(board) {
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
    setView(filterData(board))
  }, [board, textFilter, tagsFilter, propsFilter])

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
    }, 200),
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
          placeholder={t("Keyword")}
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

  return { view, renderFilterPopup }
}
