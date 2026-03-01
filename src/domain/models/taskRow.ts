/* Этот файл описывает модель одной строки задачи для ежедневного отчета. */
import type { TaskStatus } from '../types/taskStatus'

export interface TaskRow {
  id: number
  title: string
  durationText: string
  status: TaskStatus
  isIncluded: boolean
}
