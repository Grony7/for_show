/* Этот файл реализует преобразование текста длительности "X ч. Ym." в минуты и обратно. */
const durationPattern = /^\s*(?<hours>\d+)\s*ч\.\s*(?<minutes>\d+)\s*м\.\s*$/u

export class DurationParser {
  public parseDurationTextToMinutes(durationText: string): number | null {
    const durationMatchResult = durationPattern.exec(durationText)

    if (!durationMatchResult?.groups) {
      return null
    }

    const hourCount = Number(durationMatchResult.groups.hours)
    const minuteCount = Number(durationMatchResult.groups.minutes)

    if (
      !Number.isInteger(hourCount) ||
      !Number.isInteger(minuteCount) ||
      hourCount < 0 ||
      minuteCount < 0
    ) {
      return null
    }

    return hourCount * 60 + minuteCount
  }

  public formatMinutes(totalMinutes: number): string {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
      return '0 ч. 0м.'
    }

    const normalizedTotalMinutes = Math.floor(totalMinutes)
    const hourCount = Math.floor(normalizedTotalMinutes / 60)
    const minuteCount = normalizedTotalMinutes % 60

    return `${hourCount} ч. ${minuteCount}м.`
  }
}
