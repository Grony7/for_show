/* Этот файл проверяет подстановку переменных и предупреждения TemplateEngine. */
import { describe, expect, it } from 'vitest'
import type { TaskRow } from '../../domain/models/taskRow'
import { TemplateEngine } from './templateEngine'

const sampleTaskRow: TaskRow = {
  id: 4790,
  title: 'Подготовить описание задачи',
  durationText: '1 ч. 5м.',
  status: 'DONE',
}

describe('TemplateEngine', () => {
  it('renders line template with all supported variables', () => {
    const templateEngine = new TemplateEngine()
    const renderLineResult = templateEngine.renderLine(
      sampleTaskRow,
      '- {statusText} задачи №[{id}]({link}) - {title} ({duration})',
      'https://example.local/tasks/{id}',
    )

    expect(renderLineResult.renderedText).toBe(
      '- Выполнил задачи №[4790](https://example.local/tasks/4790) - Подготовить описание задачи (1 ч. 5м.)',
    )
    expect(renderLineResult.issues).toHaveLength(0)
  })

  it('replaces unknown variables with empty string and returns warning', () => {
    const templateEngine = new TemplateEngine()
    const renderLineResult = templateEngine.renderLine(
      sampleTaskRow,
      '- {statusText} {unknownVariable}',
      'https://example.local/tasks/{id}',
    )

    expect(renderLineResult.renderedText).toBe('- Выполнил ')
    expect(renderLineResult.issues).toHaveLength(1)
    expect(renderLineResult.issues[0].severity).toBe('warning')
  })

  it('adds {list} placeholder into document template when it is missing', () => {
    const templateEngine = new TemplateEngine()
    const renderDocumentResult = templateEngine.renderDocument(
      'Отчёт за {date}.',
      {
        date: '27.02.2026',
        list: '- Выполнил задачу',
        totalDuration: '0 ч. 0м.',
      },
    )

    expect(renderDocumentResult.renderedText).toContain('Отчёт за 27.02.2026.')
    expect(renderDocumentResult.renderedText).toContain('- Выполнил задачу')
    expect(
      renderDocumentResult.issues.some((issue) =>
        issue.message.includes('переменная "{list}"'),
      ),
    ).toBe(true)
  })
})
