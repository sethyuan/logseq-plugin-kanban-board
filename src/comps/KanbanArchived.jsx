import { t } from "logseq-l10n"
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "preact/hooks"
import { debounce } from "rambdax"
import { useCompositionChange } from "reactutils"
import { BoardContext } from "../libs/contexts"

const SEARCHING_FOR_CARDS = 0
const SEARCHING_FOR_LISTS = 1

export default function KanbanArchived({ board, property }) {
  const filterInputRef = useRef()
  const [searchingFor, setSearchingFor] = useState(SEARCHING_FOR_CARDS)
  const [cards, setCards] = useState([])
  const [lists, setLists] = useState([])
  const [filter, setFilter] = useState("")
  const { restoreCard, deleteCard, restoreList, deleteList } =
    useContext(BoardContext)

  useEffect(() => {
    // Focus on input after the menu gained focus.
    setTimeout(() => {
      filterInputRef.current.focus()
    }, 201)
  }, [])

  useEffect(() => {
    filterData()
  }, [filter, searchingFor])

  const changeFilter = useCallback(
    debounce((e) => {
      setFilter(e.target.value)
    }, 200),
    [],
  )
  const filterChangeProps = useCompositionChange(changeFilter)

  function toggleSearchingFor(e) {
    setSearchingFor(
      searchingFor === SEARCHING_FOR_CARDS
        ? SEARCHING_FOR_LISTS
        : SEARCHING_FOR_CARDS,
    )
  }

  async function filterData() {
    if (searchingFor === SEARCHING_FOR_CARDS) {
      const cards = (
        await logseq.DB.datascriptQuery(
          `[:find (pull ?b [*])
          :in $ ?uuid ?prop
          :where
          [?r :block/uuid ?uuid]
          [?b :block/parent ?r]
          [?b :block/properties ?props]
          [(get ?props ?prop)]
          [(get ?props :archived) ?v]
          [(= ?v true)]]`,
          `#uuid "${board.uuid}"`,
          `:${property}`,
        )
      )
        .flat()
        .filter((card) =>
          card.content.toLowerCase().includes(filter.toLowerCase()),
        )
      setCards(cards)
    } else {
      const lists = (board.configs.archived ?? []).filter((listName) =>
        listName.toLowerCase().includes(filter.toLowerCase()),
      )
      setLists(lists)
    }
  }

  async function onRestoreCard(uuid) {
    filterInputRef.current.focus()
    setCards((old) => old.filter((card) => card.uuid !== uuid))
    await restoreCard(uuid)
  }

  async function onDeleteCard(uuid) {
    if (confirm(t("Confirm deletion!"))) {
      filterInputRef.current.focus()
      setCards((old) => old.filter((card) => card.uuid !== uuid))
      await deleteCard(uuid)
    }
  }

  async function onRestoreList(listName) {
    filterInputRef.current.focus()
    setLists((old) => old.filter((name) => name !== listName))
    await restoreList(listName)
  }

  async function onDeleteList(listName) {
    if (confirm(t("Confirm deletion!"))) {
      filterInputRef.current.focus()
      setLists((old) => old.filter((name) => name !== listName))
      await deleteList(listName)
    }
  }

  return (
    <>
      <input
        ref={filterInputRef}
        class="kef-kb-archived-search"
        type="text"
        placeholder={t("Keyword")}
        value={filter}
        {...filterChangeProps}
      />
      <button class="kef-kb-archived-switchbtn" onClick={toggleSearchingFor}>
        {searchingFor === SEARCHING_FOR_CARDS
          ? t("Switch to lists")
          : t("Switch to cards")}
      </button>

      <div class="kef-kb-archived-data">
        {searchingFor === SEARCHING_FOR_CARDS &&
          cards.map((card) => (
            <div class="kef-kb-archived-card">
              <div class="kef-kb-archived-card-main">
                <div class="kef-kb-archived-card-listname">
                  {card["properties-text-values"][property].replace(
                    /\[\[([^\]]+)\]\]/g,
                    "$1",
                  )}
                </div>
                <div class="kef-kb-archived-card-content">
                  {card.content.match(/.*/)[0]}
                </div>
              </div>
              <div class="kef-kb-archived-ops">
                <button onClick={() => onRestoreCard(card.uuid)}>
                  {t("Restore")}
                </button>
                <button onClick={() => onDeleteCard(card.uuid)}>
                  {t("Delete")}
                </button>
              </div>
            </div>
          ))}

        {searchingFor === SEARCHING_FOR_LISTS &&
          lists.map((listName) => (
            <div class="kef-kb-archived-list-section">
              <div class="kef-kb-archived-list">
                <div class="kef-kb-archived-list-content">
                  {listName.replace(/\[\[([^\]]+)\]\]/g, "$1")}
                </div>
              </div>
              <div class="kef-kb-archived-ops">
                <button onClick={() => onRestoreList(listName)}>
                  {t("Restore")}
                </button>
                <button onClick={() => onDeleteList(listName)}>
                  {t("Delete")}
                </button>
              </div>
            </div>
          ))}
      </div>
    </>
  )
}
