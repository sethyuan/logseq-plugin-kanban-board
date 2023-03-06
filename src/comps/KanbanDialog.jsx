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

  function preventPropagation(e) {
    e.stopPropagation()
  }

  return (
    <form
      class="kef-kb-dialog"
      onKeyDown={preventPropagation}
      onSubmit={handleSubmit(confirm)}
    >
      <input
        type="text"
        placeholder={t("Block reference")}
        readOnly={!!uuid}
        {...register("blockRef", { required: true })}
      />
      {errors.blockRef && (
        <p>{t("${field} is required.", { field: "blockRef" })}</p>
      )}
      <input
        type="text"
        placeholder={t("Property used to create lists")}
        {...register("property", { required: true })}
      />
      {errors.property && (
        <p>{t("${field} is required.", { field: "property" })}</p>
      )}
      <button type="submit">{t("OK")}</button>
      <button onClick={cancel}>{t("Cancel")}</button>
    </form>
  )
}
