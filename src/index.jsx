import "@logseq/libs"
import { setDefaultOptions } from "date-fns"
import { zhCN as dateZhCN } from "date-fns/locale"
import { waitMs } from "jsutils"
import { setup, t } from "logseq-l10n"
import { render } from "preact"
import { debounce, partition, shuffle } from "rambdax"
import KanbanBoard from "./comps/KanbanBoard"
import KanbanDialog from "./comps/KanbanDialog"
import MarkerQueryBoard from "./comps/MarkerQueryBoard"
import { parseContent, persistBlockUUID } from "./libs/utils"
import zhCN from "./translations/zh-CN.json"

const DIALOG_ID = "kef-kb-dialog"

const BUILTIN_COLORS = [
  "e70c0c",
  "e76f0c",
  "e7b20c",
  "8ce70c",
  "3ee70c",
  "0ce7b4",
  "0ccbe7",
  "0c9ae7",
  "0c4ae7",
  "700ce7",
  "e60ce7",
  "e70c7e",
]

let dialogContainer
let offHooks = {}

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN } })

  provideStyles()

  const {
    preferredLanguage,
    preferredStartOfWeek,
    preferredDateFormat,
    preferredWorkflow,
  } = await logseq.App.getUserConfigs()
  const weekStart = (+(preferredStartOfWeek ?? 6) + 1) % 7
  setDefaultOptions({
    locale: preferredLanguage === "zh-CN" ? dateZhCN : undefined,
    weekStartsOn: weekStart,
  })

  logseq.provideUI({
    key: DIALOG_ID,
    path: "#app-container",
    template: `<div id="${DIALOG_ID}"></div>`,
  })

  // Let div root element get generated first.
  setTimeout(async () => {
    dialogContainer = parent.document.getElementById(DIALOG_ID)
  }, 0)

  logseq.App.onMacroRendererSlotted(kanbanRenderer)
  logseq.App.onMacroRendererSlotted(markerQueryRenderer)

  logseq.Editor.registerSlashCommand("Kanban Board", async () => {
    openDialog(async (blockRef, property) => {
      await logseq.Editor.insertAtEditingCursor(
        `{{renderer :kboard, ${blockRef}, ${property}}}`,
      )
    })
  })

  logseq.Editor.registerSlashCommand("Kanban Board (Empty)", async () => {
    const currentBlock = await logseq.Editor.getCurrentBlock()
    const uuid = await logseq.Editor.newBlockUUID()
    await logseq.Editor.insertAtEditingCursor(
      `{{renderer :kboard, ${uuid}, list}}`,
    )
    await logseq.Editor.insertBlock(currentBlock.uuid, "Kanban", {
      sibling: true,
      customUUID: uuid,
    })
  })

  logseq.Editor.registerSlashCommand(
    "Kanban Board (Marker Query)",
    async () => {
      const lists =
        preferredWorkflow === "now" ? "LATER, NOW, DONE" : "TODO, DOING, DONE"
      const currentBlock = await logseq.Editor.getCurrentBlock()
      await logseq.Editor.insertAtEditingCursor(
        `{{renderer :kboard-marker-query, Kanban, ${lists}}}`,
      )
      await logseq.Editor.insertBlock(
        currentBlock.uuid,
        "#+BEGIN_QUERY\n" +
          "{:query [:find (pull ?b [*])\n" +
          "        :where\n" +
          `        ]}\n` +
          "#+END_QUERY",
      )
    },
  )

  logseq.Editor.registerBlockContextMenuItem(
    t("Kanban Board"),
    async ({ uuid }) => {
      openDialog(uuid, async (blockRef, property) => {
        await persistBlockUUID(uuid)
        await logseq.Editor.insertBlock(
          uuid,
          `{{renderer :kboard, ${uuid}, ${property}}}`,
          { sibling: true, before: true },
        )
        await waitMs(50)
        await logseq.Editor.exitEditingMode()
      })
    },
  )

  logseq.beforeunload(async () => {
    for (const off of Object.values(offHooks)) {
      off?.()
    }
  })

  console.log("#kanban-board loaded")
}

function provideStyles() {
  logseq.provideStyle({
    key: "kef-kb",
    style: `
    #${DIALOG_ID} {
      position: absolute;
      top: 32px;
      left: 0;
      z-index: var(--ls-z-index-level-2);
      display: none;
    }
    .kef-kb-dialog {
      display: flex;
      flex-direction: column;
      padding: 10px;
      background: var(--ls-primary-background-color);
      box-shadow: 0 0 10px 0 lightgray;
    }
    .kef-kb-dialog-input {
      line-height: 1.5;
      padding: 5px 8px;
      margin-bottom: 0.5em;
      border-color: var(--ls-border-color);
      width: 380px;
    }
    .kef-kb-dialog-input::placeholder {
      opacity: 0.5;
    }
    .kef-kb-dialog-input:focus {
      box-shadow: none;
    }
    .kef-kb-dialog-err {
      font-size: 0.875em;
      color: var(--ls-error-text-color);
      margin-top: 0;
    }
    .kef-kb-dialog-btn {
      padding: 0.5em 0.8em;
      font-size: 0.875em;
      color: #fff;
      background-color: rgb(2 132 199);
      border-radius: 0.3em;
      margin-top: 8px;
    }

    .kef-kb-board {
      width: 100%;
      position: relative;
    }
    .kef-kb-board-lists {
      display: flex;
      width: 100%;
      overflow-x: auto;
      overflow-y: visible;
      padding: 1em 4px;
    }
    .kef-kb-board-name {
      font-size: 1.25em;
      font-weight: 600;
      padding: 0 4px;
    }
    .kef-kb-board-name-label {
      cursor: pointer;
    }
    .kef-kb-board-name-input {
      background-color: var(--ls-primary-background-color);
    }
    .kef-kb-board-name-input:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-board-icon {
      font-family: 'tabler-icons';
      font-weight: 400;
      margin-left: 0.5em;
      cursor: pointer;
    }
    .kef-kb-filter-on {
      color: var(--ls-active-primary-color);
    }
    .kef-kb-filter-menu {
      opacity: 0.95;
      font-size: 1rem;
    }
    .kef-kb-filter-menu:focus-visible {
      outline: none;
    }
    .kef-kb-filter-popup {
      width: 320px;
      max-height: 600px;
      font-size: 0.875em;
      overflow-y: auto;
    }
    .kef-kb-filter-label:first-child {
      margin-top: 0.5em;
    }
    .kef-kb-filter-label {
      margin: 1em 0.75em 0.5em;
      font-weight: 600;
    }
    .kef-kb-filter-input {
      margin: 0 0.75em;
      border-radius: 2px;
      padding: 0.3em;
      width: calc(100% - 2 * 0.75em);
      background-color: var(--ls-primary-background-color) !important;
      line-height: 1.4;
    }
    .kef-kb-filter-input:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-filter-select {
      margin: 0 0.75em 0.5em;
      width: calc(100% - 2 * 0.75em);
      padding: 0.3em;
      border-radius: 2px;
      font-size: 1em;
      line-height: 1.4;
      background-color: var(--ls-primary-background-color);
    }
    .kef-kb-filter-select:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-filter-checkbox {
      display: block;
      margin: 0 0.75em 0.3em;
    }
    .kef-kb-filter-checkbox input:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-filter-checkbox span {
      margin-left: 0.8em;
      background: var(--ls-active-secondary-color);
      border-radius: 2px;
      padding: 1px 7px;
      color: #fff;
      font-size: 0.85714em;
      vertical-align: middle;
    }
    .kef-kb-filter-prop-row {
      display: flex;
      margin: 0 0.75em 0.5em;
      align-items: center;
    }
    .kef-kb-filter-prop-remove {
      flex: 0 0 auto;
      margin-right: 0.3em;
      font-family: 'tabler-icons';
      font-weight: 400;
    }
    .kef-kb-filter-prop-remove:hover {
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-filter-prop-key {
      flex: 0 0 auto;
      width: 100px;
      border-radius: 2px;
      padding: 0.3em;
      background-color: var(--ls-primary-background-color) !important;
      margin-right: 0.25em;
      line-height: 1.4;
    }
    .kef-kb-filter-prop-key:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-filter-prop-value {
      flex: 1 1 auto;
      border-radius: 2px;
      padding: 0.3em;
      background-color: var(--ls-primary-background-color) !important;
      margin-left: 0.75em;
      line-height: 1.4;
    }
    .kef-kb-filter-prop-value:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-filter-prop-add {
      display: block;
      font-family: 'tabler-icons';
      font-weight: 400;
      font-size: 1.142857em;
      margin: 0 0.75em;
      transform: translateX(-3px);
    }
    .kef-kb-filter-prop-add:hover {
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-filter-reset {
      margin: 1em 0.75em 0.5em;
      padding: 0 0.25em;
      cursor: pointer;
    }
    .kef-kb-filter-reset:hover {
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-menu-popup {
      font-size: 1rem;
      font-weight: 400;
    }
    .kef-kb-list {
      flex: 0 0 auto;
      width: 260px;
      margin-right: 15px;
      padding-bottom: 10px;
      background-color: var(--ls-secondary-background-color);
      box-shadow: 1px 1px 6px 0 #88888894;
    }
    .kef-kb-list-title {
      display: flex;
      align-items: center;
      padding: 0 8px;
    }
    .kef-kb-list-name {
      flex: 0 1 auto;
      margin: 0;
      font-size: 1.25em;
      font-weight: 600;
      line-height: 2;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .kef-kb-list-name span {
      cursor: pointer;
    }
    .kef-kb-list-name input {
      background-color: var(--ls-primary-background-color);
    }
    .kef-kb-list-name input:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-list-size {
      flex: 0 0 auto;
      font-size: 0.75em;
      font-weight: 400;
      margin-left: 0.3em;
    }
    .kef-kb-list-expander {
      flex: 1 1 0%;
    }
    .kef-kb-list-menuicon {
      flex: 0 0 auto;
      font-family: 'tabler-icons';
      margin-left: 0.3em;
    }
    .kef-kb-list-menuicon:hover {
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-list-cards {
      overflow-y: auto;
      max-height: calc(100vh - 300px);
      padding: 4px 8px;
    }
    .kef-kb-card {
      background-color: var(--ls-primary-background-color);
      margin-bottom: 8px;
      padding-bottom: 8px;
      box-shadow: 0px 0px 2px 0 var(--ls-block-bullet-border-color);
      border-radius: 2px;
      cursor: pointer;
      overflow: hidden;
    }
    .kef-kb-card:hover {
      box-shadow: 0px 0px 2px 2px var(--ls-block-bullet-border-color);
    }
    .kef-kb-card-cover {
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 9;
      object-fit: cover;
    }
    .kef-kb-card-content {
      padding: 8px 8px 0;
      user-select: none;
    }
    .kef-kb-card-duration {
      font-family: 'tabler-icons';
      margin-left: 0.75em;
      color: var(--ls-active-primary-color);
      vertical-align: top;
    }
    .kef-kb-card-duration-popup {
      display: grid;
      grid-template-columns: auto 1fr;
      background-color: var(--ls-secondary-background-color);
      padding: 0.75em;
      min-width: 200px;
      box-shadow: 0 2px 8px 0 #88888894;
    }
    .kef-kb-card-duration-popup-l {
      font-size: 0.875em;
      font-weight: 600;
      margin-right: 1em;
      margin-bottom: 0.5em;
    }
    .kef-kb-card-duration-popup-v {
      font-size: 0.875em;
    }
    .kef-kb-card-tags {
      display: flex;
      flex-flow: row wrap;
      margin-top: 0.25em;
      padding: 0 8px;
    }
    .kef-kb-card-tag {
      flex: 0 0 auto;
      font-size: 0.625em;
      margin-right: 0.5em;
      margin-bottom: 0.25em;
      background: var(--ls-active-secondary-color);
      border-radius: 2px;
      padding: 1px 7px;
      color: #fff;
      cursor: pointer;
      user-select: none;
    }
    .kef-kb-card-tag:last-child {
      margin-right: 0;
    }
    .kef-kb-card-props {
      display: grid;
      grid-template-columns: auto 1fr;
      background-color: var(--ls-secondary-background-color);
      padding: 5px 7px;
      margin: 0.3em 7px 0;
    }
    .kef-kb-card-props-key {
      font-size: 0.75em;
      margin-right: 1em;
      font-weight: 600;
    }
    .kef-kb-card-props-val {
      font-size: 0.75em;
    }
    .kef-kb-addone {
      padding: 0.25em 8px;
    }
    .kef-kb-addone-addbtn {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .kef-kb-addone-addbtn:hover {
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-addone-input {
      line-height: 1.5;
      padding: 5px 8px;
      border-color: var(--ls-border-color);
      background-color: var(--ls-primary-background-color) !important;
      border-radius: 0.25em;
      resize: vertical !important;
      overflow-y: auto !important;
    }
    .kef-kb-addone-input:focus {
      box-shadow: none;
      border-color: inherit;
    }
    .kef-kb-addone-btns {
      display: flex;
      align-items: center;
    }
    .kef-kb-addone-btn {
      flex: 0 0 auto;
      margin-right: 0.25em;
      padding: 0 0.25em;
      cursor: pointer;
    }
    .kef-kb-addone-btn:hover {
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-addlist {
      flex: 0 0 auto;
      width: 260px;
      padding: 0 8px;
    }
    .kef-kb-menu {
      position: absolute;
      box-shadow: 0 2px 8px 0 var(--ls-block-bullet-color);
      background-color: var(--ls-secondary-background-color);
      padding: 0.5em 0;
      z-index: var(--ls-z-index-level-2);
    }
    .kef-kb-menu:focus-visible {
      outline: none;
    }
    .kef-kb-menu-item {
      display: block;
      padding: 0.5em 0.75em;
      width: 100%;
      text-align: left;
      user-select: none;
      font-size: 0.875em;
    }
    .kef-kb-menu-item:hover {
      background-color: var(--ls-primary-background-color);
    }
    .kef-kb-popup {
      position: fixed;
      z-index: var(--ls-z-index-level-2);
      transform: translateY(-50%);
    }
    .kef-kb-archived-search {
      display: block;
      margin: 0.3em 0.75em 0;
      width: 260px;
      border-radius: 2px;
      padding: 0.3em;
      line-height: 1.4;
      background-color: var(--ls-primary-background-color) !important;
    }
    .kef-kb-archived-search:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-archived-switchbtn {
      display: block;
      margin: 0.5em 0.75em;
    }
    .kef-kb-archived-switchbtn:hover {
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-archived-data {
      margin: 1em 0.75em 0;
    }
    .kef-kb-archived-card {
      margin-top: 0.5em;
      margin-bottom: 0.75em;
    }
    .kef-kb-archived-card-main {
      background-color: var(--ls-primary-background-color);
      border-radius: 2px;
      padding: 0.5em;
      border: 1px solid var(--ls-border-color);
    }
    .kef-kb-archived-card-listname {
      font-size: 0.75em;
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-archived-ops {
      font-size: 0.875em;
      padding-left: 0.3em;
    }
    .kef-kb-archived-ops button {
      margin-right: 0.75em;
      padding: 0.3em 0;
    }
    .kef-kb-archived-ops button:hover {
      color: var(--ls-active-secondary-color);
    }
    .kef-kb-archived-list-section {
      margin-top: 0.5em;
      margin-bottom: 0.75em;
    }
    .kef-kb-archived-list {
      background-color: var(--ls-primary-background-color);
      border-radius: 2px;
      padding: 0.5em;
      border: 1px solid var(--ls-border-color);
    }
    .kef-kb-autoarchive-desc {
      max-width: 320px;
      margin: 0.5em 0.75em 0;
      font-size: 0.875em;
    }
    .kef-kb-autoarchive-label {
      margin: 0.75em 0.75em 0.5em;
      font-weight: 600;
    }
    .kef-kb-autoarchive-list {
      margin: 0 0.75em 0.5em;
      width: calc(100% - 2 * 0.75em);
      padding: 0.3em;
      border-radius: 2px;
      font-size: 1em;
      line-height: 1.4;
      background-color: var(--ls-primary-background-color);
    }
    .kef-kb-autoarchive-list:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-autoarchive-inputrow {
      display: flex;
      align-items: baseline;
      margin: 0 0.75em;
    }
    .kef-kb-autoarchive-input {
      flex: 1 1 auto;
      border-radius: 2px;
      padding: 0.3em;
      width: calc(100% - 2 * 0.75em);
      background-color: var(--ls-primary-background-color) !important;
      line-height: 1.4;
    }
    .kef-kb-autoarchive-input:focus {
      outline: none;
      box-shadow: none;
    }
    .kef-kb-autoarchive-input:invalid {
      border: 1px solid red;
    }
    .kef-kb-autoarchive-suffix {
      flex: 0 0 auto;
      margin-left: 0.75em;
    }
    .kef-kb-autoarchive-btns {
      margin: 1.25em 0.75em 0.5em;
      display: flex;
      justify-content: space-between;
    }
    .kef-kb-autoarchive-btn {
      padding: 0 0.25em;
      cursor: pointer;
    }
    .kef-kb-autoarchive-btn:hover {
      color: var(--ls-active-secondary-color);
    }
    `,
  })
}

async function kanbanRenderer({ slot, payload: { arguments: args, uuid } }) {
  if (args.length === 0) return
  const type = args[0].trim()
  if (type !== ":kboard") return

  const blockRefArg = args[1].trim()
  const blockRef = blockRefArg.startsWith("((")
    ? blockRefArg.substring(2, blockRefArg.length - 2)
    : blockRefArg
  if (!blockRef) return

  const property = args[2].trim()
  if (!property) return

  const coverProp = args[3]?.trim()

  const columnWidth = args[4]?.trim()

  const slotEl = parent.document.getElementById(slot)
  if (!slotEl) return
  const renderered = slotEl?.childElementCount > 0
  if (renderered) return

  slotEl.style.width = "100%"

  const key = `kef-kb-${slot}`
  logseq.provideUI({
    key,
    slot,
    template: `<div id="${key}" style="width: 100%"></div>`,
    style: {
      cursor: "default",
      width: "100%",
    },
  })

  setTimeout(async () => {
    const rootBlock = await logseq.Editor.getBlock(blockRef)
    const offHook = watchBlockChildrenChange(
      rootBlock.id,
      key,
      debounce((blocks, txData, txMeta) => {
        renderKanban(key, blockRef, property, coverProp)
      }, 300),
    )
    offHooks[key] = offHook

    renderKanban(key, blockRef, property, coverProp, columnWidth)
  }, 0)
}

async function markerQueryRenderer({
  slot,
  payload: { arguments: args, uuid },
}) {
  if (args.length === 0) return
  const type = args[0].trim()
  if (type !== ":kboard-marker-query") return

  const name = args[1]?.trim()
  if (!name) return

  const lists = args.slice(2).map((arg) => arg.trim())
  if (lists.length < 1) return

  const columnWidth = args[3]?.trim()

  const slotEl = parent.document.getElementById(slot)
  if (!slotEl) return
  const renderered = slotEl?.childElementCount > 0
  if (renderered) return

  slotEl.style.width = "100%"

  const key = `kef-kb-${slot}`
  logseq.provideUI({
    key,
    slot,
    template: `<div id="${key}" style="width: 100%"></div>`,
    style: {
      cursor: "default",
      width: "100%",
    },
  })

  setTimeout(async () => {
    renderMarkerQueryKanban(key, uuid, name, lists, columnWidth)
  }, 0)
}

function openDialog(...args) {
  const [uuid, callback] =
    typeof args[0] === "function" ? [undefined, args[0]] : [args[0], args[1]]

  const editor = uuid
    ? parent.document.getElementById(`block-content-${uuid}`)
    : parent.document.activeElement?.closest(".block-editor")
  if (editor == null) return

  render(
    <KanbanDialog
      visible={{}}
      uuid={uuid}
      onConfirm={(blockRef, property) => {
        closeDialog()
        callback(blockRef, property)
      }}
      onClose={() => {
        closeDialog()
      }}
    />,
    dialogContainer,
  )
  editor.appendChild(dialogContainer)
  dialogContainer.style.display = "block"
}

function closeDialog() {
  dialogContainer.style.display = "none"
}

function watchBlockChildrenChange(id, elID, callback) {
  return logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
    const rendererEl = parent.document.getElementById(elID)
    if (rendererEl == null || !rendererEl.isConnected) {
      offHooks[elID]?.()
      delete offHooks[elID]
      return
    }

    const predicate = (block) => block.id === id || block.parent?.id === id
    if (
      txMeta &&
      txMeta.outlinerOp !== "insertBlock" &&
      blocks.some(predicate)
    ) {
      callback(blocks.filter(predicate), txData, txMeta)
    }
  })
}

async function renderKanban(id, boardUUID, property, coverProp, columnWidth) {
  const el = parent.document.getElementById(id)
  if (el == null || !el.isConnected) return

  const data = await getBoardData(boardUUID, property, coverProp)
  if (await maintainPlaceholders(data.lists, property)) return
  if (await maintainTagColors(boardUUID, data.tags, data.configs)) return
  render(
    <KanbanBoard board={data} property={property} columnWidth={columnWidth} />,
    el,
  )
}

async function getBoardData(boardUUID, property, coverProp) {
  const boardBlock = await logseq.Editor.getBlock(boardUUID)
  const [name] = await parseContent(boardBlock.content)
  const configs = JSON.parse(
    boardBlock.properties?.configs ?? '{"tagColors": {}, "archived": []}',
  )
  const [blocks, tags] = await getChildren(
    boardUUID,
    property,
    coverProp,
    configs,
  )
  const lists = groupBy(blocks, (block) => block.properties[property])
  if (configs.archived) {
    for (const listName of Object.keys(lists)) {
      if (configs.archived.includes(listName)) {
        delete lists[listName]
      }
    }
  }
  return { name, uuid: boardUUID, lists, tags, configs }
}

async function getChildren(uuid, property, coverProp, configs) {
  const dbResult = (
    await logseq.DB.datascriptQuery(
      `[:find (pull ?b [*])
       :in $ ?uuid
       :where
       [?r :block/uuid ?uuid]
       [?b :block/parent ?r]]`,
      `#uuid "${uuid}"`,
    )
  ).flat()

  const map = new Map()
  for (const block of dbResult) {
    map.set(block.left.id, block)
  }
  for (let i = 0, id = dbResult[0]?.parent.id; i < dbResult.length; i++) {
    const b = map.get(id)
    dbResult[i] = b
    id = b.id
  }

  const filtered = dbResult.filter(
    (block) =>
      block.properties &&
      block.properties[property] &&
      !block.properties.archived,
  )
  for (const block of filtered) {
    if (Array.isArray(block.properties[property])) {
      block.properties[property] = `[[${block.properties[property][0]}]]`
    } else {
      block.properties[property] = `${block.properties[property]}`
    }
  }

  const [blocksToArchive, blocks] =
    configs.autoArchiving != null
      ? partition((block) => {
          if (block.properties[property] !== configs.autoArchiving.list)
            return false
          if (!block.properties.duration) return false
          if (block.content.includes("#.kboard-placeholder")) return false
          const duration = JSON.parse(block.properties.duration)
          const isPage = configs.autoArchiving.list.startsWith("[[")
          const durationList =
            duration[
              isPage
                ? `{${configs.autoArchiving.list.substring(1)}`
                : configs.autoArchiving.list
            ]
          if (durationList == null) return false
          const [acc, last] = durationList
          const nowTs = Date.now()
          const now = nowTs + acc
          const elapsed = now - (last || nowTs)
          const dur =
            isNaN(configs.autoArchiving.duration) ||
            configs.autoArchiving.duration < 1
              ? 1
              : configs.autoArchiving.duration
          return elapsed > dur * 24 * 60 * 60 * 1000
        }, filtered)
      : [[], filtered]

  await Promise.all(
    blocksToArchive.map((block) =>
      logseq.Editor.upsertBlockProperty(block.uuid, "archived", true),
    ),
  )

  const allTags = new Set()
  for (const block of blocks) {
    const [content, tags, props, cover, scheduled, deadline] =
      await parseContent(block.content, coverProp)
    block.data = {
      content,
      tags,
      props,
      cover,
      scheduled,
      deadline,
    }
    for (const tag of tags) {
      allTags.add(tag)
    }
  }
  allTags.delete(".kboard-placeholder")

  return [blocks, allTags]
}

function groupBy(arr, selector) {
  const ret = {}
  for (const x of arr) {
    const key = selector(x)
    if (!key) continue
    if (ret[key] == null) {
      ret[key] = []
    }
    ret[key].push(x)
  }
  return ret
}

async function maintainPlaceholders(lists, property) {
  let maintained = false
  for (const [name, list] of Object.entries(lists)) {
    if (!list.some((block) => block.content.includes(".kboard-placeholder"))) {
      logseq.Editor.insertBlock(
        list[list.length - 1].uuid,
        `placeholder #.kboard-placeholder\n${property}:: ${name}`,
        { sibling: true },
      )
      maintained = true
    }
  }
  return maintained
}

async function maintainTagColors(uuid, tags, configs) {
  let maintained = false
  for (const tag of Object.keys(configs.tagColors)) {
    if (!tags.has(tag)) {
      delete configs.tagColors[tag]
      maintained = true
    }
  }
  const colors = colorPalette(configs.tagColors)
  const palette = infinitePalette(colors)
  for (const tag of tags) {
    if (configs.tagColors[tag] == null) {
      configs.tagColors[tag] = palette.next().value
      maintained = true
    }
  }
  if (maintained) {
    await logseq.Editor.upsertBlockProperty(
      uuid,
      "configs",
      JSON.stringify(configs),
    )
  }
  return maintained
}

function colorPalette(tagColors) {
  const configuredColors = new Set(Object.values(tagColors))
  const [notUsed, used] = partition(
    (c) => !configuredColors.has(c),
    BUILTIN_COLORS,
  )
  return shuffle(notUsed).concat(used)
}

function* infinitePalette(palette) {
  let i = 0
  while (true) {
    const finish = yield palette[i]
    i = (i + 1) % palette.length
  }
}

async function renderMarkerQueryKanban(id, uuid, name, lists, columnWidth) {
  const el = parent.document.getElementById(id)
  if (el == null || !el.isConnected) return

  const data = await getQueryBoardData(uuid, name, lists)
  await maintainTagColors(uuid, data.tags, data.configs)
  render(
    <MarkerQueryBoard
      board={data}
      columnWidth={columnWidth}
      onRefresh={() => renderMarkerQueryKanban(id, uuid, name, lists)}
    />,
    el,
  )
}

async function getQueryBoardData(uuid, name, statuses) {
  const boardBlock = await logseq.Editor.getBlock(uuid, {
    includeChildren: true,
  })
  const queryBlock = boardBlock.children[0]
  if (queryBlock == null) return null

  const qs = queryBlock.content.match(/\[:find[\s\S]+]/m)?.[0]
  if (!qs) return null

  const allTags = new Set()
  const lists = {}

  try {
    const data = (await logseq.DB.customQuery(qs))
      .flat()
      .filter((block) => statuses.includes(block.marker))

    for (const status of statuses) {
      lists[status] = []
    }

    for (const task of data) {
      lists[task.marker].push(task)

      const [content, tags, props, cover, scheduled, deadline] =
        await parseContent(task.content)
      task.data = {
        content,
        tags,
        props,
        cover,
        scheduled,
        deadline,
      }
      for (const tag of tags) {
        allTags.add(tag)
      }
    }

    const configs = JSON.parse(
      boardBlock.properties?.configs ?? '{"tagColors": {}}',
    )

    return { name, uuid, lists, tags: allTags, configs }
  } catch (err) {
    return { name, uuid, lists, tags: allTags, configs: { tagColors: {} } }
  }
}

logseq.ready(main).catch(console.error)
