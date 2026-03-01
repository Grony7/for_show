/* Этот файл задает порт сервиса извлечения изображения из буфера обмена. */
export interface ClipboardImageServicePort {
  extractImageFromClipboard(clipboardEvent: ClipboardEvent): File | null
}
