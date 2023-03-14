import { t } from "logseq-l10n"
import { useEffect } from "preact/hooks"
import { useForm } from "react-hook-form"

export default function KanbanDialog({ visible, uuid, onConfirm, onClose }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    reset({
      blockRef: uuid ?? "",
      property: "",
    })

    if (visible) {
      if (!!uuid) {
        parent.document.getElementById("kef-kb-dialog-propinput").focus()
      } else {
        parent.document.getElementById("kef-kb-dialog-refinput").focus()
      }
    }
  }, [visible, uuid])

  function confirm(data) {
    onConfirm(data.blockRef, data.property)
  }

  function onKeyDown(e) {
    e.stopPropagation()
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    }
  }

  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <form
      class="kef-kb-dialog"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onMouseDown={stopPropagation}
      onSubmit={handleSubmit(confirm)}
    >
      <input
        id="kef-kb-dialog-refinput"
        class="kef-kb-dialog-input"
        type="text"
        placeholder={t("Block reference")}
        readOnly={!!uuid}
        {...register("blockRef", { required: true })}
      />
      {errors.blockRef && <p class="kef-kb-dialog-err">{t("Required.")}</p>}
      <input
        id="kef-kb-dialog-propinput"
        class="kef-kb-dialog-input"
        type="text"
        placeholder={t("Property used to create lists")}
        {...register("property", { required: true })}
      />
      {errors.property && <p class="kef-kb-dialog-err">{t("Required.")}</p>}
      <div>
        <button class="kef-kb-dialog-btn" type="submit">
          {t("OK")}
        </button>
      </div>
    </form>
  )
}
