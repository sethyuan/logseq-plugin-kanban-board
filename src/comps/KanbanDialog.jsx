import { t } from "logseq-l10n"
import { useEffect } from "preact/hooks"
import { useForm } from "react-hook-form"

export default function KanbanDialog({ uuid, onConfirm, onClose }) {
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
  }, [onConfirm, uuid])

  function confirm(data) {
    onConfirm(data.blockRef, data.property)
  }

  function cancel(e) {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  function onKeyDown(e) {
    e.stopPropagation()
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <form
      class="kef-kb-dialog"
      onKeyDown={onKeyDown}
      onSubmit={handleSubmit(confirm)}
    >
      <input
        class="kef-kb-dialog-input"
        type="text"
        placeholder={t("Block reference")}
        readOnly={!!uuid}
        {...register("blockRef", { required: true })}
      />
      {errors.blockRef && <p class="kef-kb-dialog-err">{t("Required.")}</p>}
      <input
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
