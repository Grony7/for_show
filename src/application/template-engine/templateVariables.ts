/* Этот файл хранит поддерживаемые переменные шаблонов строки и документа. */
export const lineTemplateVariableNames = [
  'id',
  'title',
  'duration',
  'statusText',
  'link',
] as const

export const documentTemplateVariableNames = [
  'date',
  'list',
  'totalDuration',
] as const

export type LineTemplateVariableName = (typeof lineTemplateVariableNames)[number]
export type DocumentTemplateVariableName =
  (typeof documentTemplateVariableNames)[number]

export type LineTemplateVariables = Record<LineTemplateVariableName, string>
export type DocumentTemplateVariables = Record<DocumentTemplateVariableName, string>

export const lineTemplateVariableTokens = lineTemplateVariableNames.map(
  (lineTemplateVariableName) => `{${lineTemplateVariableName}}`,
) as readonly string[]

export const documentTemplateVariableTokens = documentTemplateVariableNames.map(
  (documentTemplateVariableName) => `{${documentTemplateVariableName}}`,
) as readonly string[]
