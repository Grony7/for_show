/* Этот файл задает порт OCR-сервиса для распознавания текста из изображения. */
export interface OcrProgressInfo {
  statusText: string
  progressRatio: number
}

export interface OcrServicePort {
  recognizeTextFromImage(
    imageFile: File,
    onProgressUpdated: (ocrProgressInfo: OcrProgressInfo) => void,
  ): Promise<string>
}
