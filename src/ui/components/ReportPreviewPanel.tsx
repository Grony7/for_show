/* Этот файл рендерит итоговый markdown и кнопку копирования результата. */
import styles from './ReportPreviewPanel.module.css'

export interface ReportPreviewPanelProps {
  markdownResultText: string
  onCopyResultRequested: () => void
}

export function ReportPreviewPanel({
  markdownResultText,
  onCopyResultRequested,
}: ReportPreviewPanelProps) {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Готовый результат</h2>
      <textarea
        readOnly
        value={markdownResultText}
        className={styles.resultArea}
        placeholder="После разбора здесь появится markdown-список задач."
      />
      <button
        type="button"
        onClick={onCopyResultRequested}
        className={styles.button}
      >
        Копировать результат
      </button>
    </section>
  )
}
