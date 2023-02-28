import "@/style/index.css"
import zhCN from "@/translations/zh-CN.json"
import "@logseq/libs"
import { setup, t } from "logseq-l10n"
import { useEffect, useState } from "preact/hooks"

export default function App() {
  const [data, setData] = useState({ visible: false })

  useEffect(() => {
    async function main() {
      await setup({ builtinTranslations: { "zh-CN": zhCN } })

      logseq.useSettingsSchema([
        {
          key: "openInSidebar",
          type: "boolean",
          default: false,
          description: t("Click on the card opens it in the sidebar."),
        },
      ])

      // logseq.beforeunload(async () => {})

      console.log("#kanban-board loaded")
    }

    const model = {
      showUI() {
        logseq.showMainUI({ autoFocus: true })
      },
    }

    logseq.ready(model, main).catch(console.error)
  }, [])

  return <Shell {...data} />
}
