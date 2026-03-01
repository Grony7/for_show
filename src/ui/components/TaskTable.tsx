/* Этот файл рендерит таблицу задач, переключатель статуса и массовые действия. */
import type { TaskRow } from '../../domain/models/taskRow'
import {
  taskStatusLabelByValue,
  taskStatusShortLabelByValue,
} from '../../domain/types/taskStatus'
import type { TaskStatus } from '../../domain/types/taskStatus'
import styles from './TaskTable.module.css'

export interface TaskTableProps {
  parsedTaskRows: TaskRow[]
  taskStatusOptions: readonly TaskStatus[]
  onTaskIncludedChanged: (taskId: number, isIncluded: boolean) => void
  onTaskStatusChanged: (taskId: number, status: TaskStatus) => void
  onApplyStatusToAllRequested: (status: TaskStatus) => void
}

export function TaskTable({
  parsedTaskRows,
  taskStatusOptions,
  onTaskIncludedChanged,
  onTaskStatusChanged,
  onApplyStatusToAllRequested,
}: TaskTableProps) {
  return (
    <section className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Предпросмотр распознанных задач</h2>
        <div className={styles.bulkActions}>
          {taskStatusOptions.map((taskStatus) => (
            <button
              key={taskStatus}
              type="button"
              className={styles.bulkButton}
              onClick={() => onApplyStatusToAllRequested(taskStatus)}
            >
              Всем: {taskStatusShortLabelByValue[taskStatus]}
            </button>
          ))}
        </div>
      </div>

      {parsedTaskRows.length === 0 ? (
        <p className={styles.emptyState}>Пока нет распознанных задач.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxColumn}>Вкл.</th>
                <th>Статус</th>
                <th>ID</th>
                <th>Текст задачи</th>
                <th>Время</th>
              </tr>
            </thead>
            <tbody>
              {parsedTaskRows.map((taskRow) => (
                <tr
                  key={taskRow.id}
                  className={taskRow.isIncluded ? '' : styles.rowExcluded}
                >
                  <td className={styles.checkboxColumn}>
                    <input
                      type="checkbox"
                      checked={taskRow.isIncluded}
                      onChange={(event) =>
                        onTaskIncludedChanged(taskRow.id, event.target.checked)
                      }
                      className={styles.includeCheckbox}
                    />
                  </td>
                  <td>
                    <div className={styles.statusSegmentedControl}>
                      {taskStatusOptions.map((taskStatus) => (
                        <button
                          key={taskStatus}
                          type="button"
                          className={`${styles.statusButton} ${
                            taskRow.status === taskStatus
                              ? styles.statusButtonActive
                              : ''
                          }`}
                          onClick={() => onTaskStatusChanged(taskRow.id, taskStatus)}
                          title={taskStatusLabelByValue[taskStatus]}
                        >
                          {taskStatusShortLabelByValue[taskStatus]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>{taskRow.id}</td>
                  <td>{taskRow.title}</td>
                  <td>{taskRow.durationText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
