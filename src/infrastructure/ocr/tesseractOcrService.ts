/* Этот файл содержит OCR-сервис на базе tesseract.js для клиентского распознавания. */
import type {
  OcrProgressInfo,
  OcrServicePort,
} from '../../application/ports/ocrServicePort'

interface TesseractLoggerMessage {
  status?: string
  progress?: number
}

function normalizeOcrProgress(
  tesseractLoggerMessage: TesseractLoggerMessage,
): OcrProgressInfo {
  return {
    statusText: tesseractLoggerMessage.status ?? 'processing',
    progressRatio:
      typeof tesseractLoggerMessage.progress === 'number'
        ? tesseractLoggerMessage.progress
        : 0,
  }
}

export class TesseractOcrService implements OcrServicePort {
  public async recognizeTextFromImage(
    imageFile: File,
    onProgressUpdated: (ocrProgressInfo: OcrProgressInfo) => void,
  ): Promise<string> {
    const tesseractModule = await import('tesseract.js')
    const tesseractWorker = await tesseractModule.createWorker(
      'rus+eng',
      undefined,
      {
        logger: (tesseractLoggerMessage: TesseractLoggerMessage) => {
          onProgressUpdated(normalizeOcrProgress(tesseractLoggerMessage))
        },
      },
    )

    try {
      const recognitionResult = await tesseractWorker.recognize(imageFile)
      return recognitionResult.data.text
    } finally {
      await tesseractWorker.terminate()
    }
  }
}
