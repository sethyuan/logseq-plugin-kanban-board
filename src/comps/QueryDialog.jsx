import { t } from "logseq-l10n"
import { useEffect } from "preact/hooks"
import { useForm } from "react-hook-form"

export default function QueryDialog({ visible, onConfirm, onClose }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    reset({
      name: "",
      property: "",
      propertyValues: "",
    })

    if (visible) {
      parent.document.getElementById("kef-kb-qdialog-refinput").focus()
    }
  }, [visible])

  function confirm(data) {
    onConfirm(
      data.name,
      data.property,
      data.propertyValues?.replaceAll("，", ","),
    )
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
        id="kef-kb-qdialog-refinput"
        class="kef-kb-dialog-input"
        type="text"
        placeholder={t("Board name")}
        {...register("name", { required: true })}
      />
      {errors.name && <p class="kef-kb-dialog-err">{t("Required.")}</p>}
      <input
        id="kef-kb-qdialog-propinput"
        class="kef-kb-dialog-input"
        type="text"
        placeholder={t("Property used to create lists")}
        {...register("property", { required: true })}
      />
      {errors.property && <p class="kef-kb-dialog-err">{t("Required.")}</p>}
      <input
        id="kef-kb-qdialog-propvinput"
        class="kef-kb-dialog-input"
        type="text"
        placeholder={t("Comma separated property values")}
        {...register("propertyValues")}
      />
      <div>
        <button class="kef-kb-dialog-btn" type="submit">
          {t("OK")}
        </button>
      </div>
    </form>
  )
}
