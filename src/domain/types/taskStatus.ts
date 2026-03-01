/* Этот файл хранит коды статусов задачи, их отображение и значение по умолчанию. */
export const taskStatusValues = ['STARTED', 'DONE', 'FINISHED'] as const

export type TaskStatus = (typeof taskStatusValues)[number]

export const taskStatusLabelByValue: Record<TaskStatus, string> = {
  STARTED: 'Начал выполнение',
  DONE: 'Выполнил',
  FINISHED: 'Закончил выполнение',
}

export const taskStatusShortLabelByValue: Record<TaskStatus, string> = {
  STARTED: 'Начал',
  DONE: 'Выполнил',
  FINISHED: 'Закончил',
}

export const defaultTaskStatus: TaskStatus = 'DONE'
