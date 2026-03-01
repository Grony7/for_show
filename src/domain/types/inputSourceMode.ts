/* Этот файл хранит режимы источника данных для построения отчета. */
export const inputSourceModeValues = ['TEXT', 'IMAGE'] as const

export type InputSourceMode = (typeof inputSourceModeValues)[number]

export const inputSourceModeLabelByValue: Record<InputSourceMode, string> = {
  TEXT: 'Из текста',
  IMAGE: 'Из картинки',
}
