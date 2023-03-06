import "@logseq/libs"
import { waitMs } from "jsutils"
import { setup, t } from "logseq-l10n"
import { render } from "preact"
import KanbanDialog from "./comps/KanbanDialog"
import zhCN from "./translations/zh-CN.json"

const DIALOG_ID = "kef-kb-dialog"

let dialogContainer
let dialogContainerParent

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN } })

  provideStyles()

  logseq.useSettingsSchema([
    {
      key: "openInSidebar",
      type: "boolean",
      default: false,
      description: t("Click on the card opens it in the sidebar."),
    },
  ])

  logseq.provideUI({
    key: DIALOG_ID,
    path: "#app-container",
    template: `<div id="${DIALOG_ID}"></div>`,
  })

  // Let div root element get generated first.
  setTimeout(async () => {
    dialogContainer = parent.document.getElementById(DIALOG_ID)
    dialogContainerParent = dialogContainer.parentNode
  }, 0)

  logseq.App.onMacroRendererSlotted(kanbanRenderer)

  logseq.Editor.registerSlashCommand("Kanban Board", async () => {
    try {
      const { blockRef, property } = await openDialog()
      await logseq.Editor.insertAtEditingCursor(
        `{{renderer :kboard, ${blockRef}, ${property}}}`,
      )
    } catch {
      // dialog canceled
    }
  })

  logseq.Editor.registerBlockContextMenuItem(
    t("Kanban Board"),
    async ({ uuid }) => {
      try {
        const { property } = await openDialog(uuid)
        await logseq.Editor.insertBlock(
          uuid,
          `{{renderer :kboard, ${uuid}, ${property}}}`,
          { sibling: true, before: true },
        )
        await waitMs(50)
        await logseq.Editor.exitEditingMode()
      } catch {
        // dialog canceled
      }
    },
  )

  // logseq.beforeunload(async () => {})

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
    }
    `,
  })
}

async function kanbanRenderer({ slot, payload: { arguments: args, uuid } }) {
  // TODO
  console.log("renderer", slot, args, uuid)
}

function openDialog(uuid) {
  const editor = uuid
    ? parent.document.getElementById(`block-content-${uuid}`)
    : parent.document.activeElement?.closest(".block-editor")
  return new Promise((resolve, reject) => {
    if (editor == null) reject()
    render(
      <KanbanDialog
        uuid={uuid}
        onConfirm={(blockRef, property) => {
          closeDialog()
          resolve({ blockRef, property })
        }}
        onClose={() => {
          closeDialog()
          reject()
        }}
      />,
      dialogContainer,
    )
    editor.appendChild(dialogContainer)
    dialogContainer.style.display = "block"
  })
}

function closeDialog() {
  dialogContainer.style.display = "none"
  dialogContainerParent.appendChild(dialogContainer)
}

logseq.ready(main).catch(console.error)
