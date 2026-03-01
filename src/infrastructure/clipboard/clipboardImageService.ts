/* Этот файл содержит сервис извлечения изображения из события вставки буфера обмена. */
import type { ClipboardImageServicePort } from '../../application/ports/clipboardImageServicePort'

const supportedClipboardImageTypes = ['image/png', 'image/jpeg']

function hasSupportedImageType(mimeType: string): boolean {
  return supportedClipboardImageTypes.includes(mimeType)
}

function createFallbackFileName(imageMimeType: string): string {
  const imageExtension = imageMimeType === 'image/png' ? 'png' : 'jpg'
  return `pasted-image-${Date.now()}.${imageExtension}`
}

function ensureFileName(sourceFile: File): File {
  if (sourceFile.name.trim().length > 0) {
    return sourceFile
  }

  return new File([sourceFile], createFallbackFileName(sourceFile.type), {
    type: sourceFile.type,
    lastModified: sourceFile.lastModified,
  })
}

export class ClipboardImageService implements ClipboardImageServicePort {
  public extractImageFromClipboard(clipboardEvent: ClipboardEvent): File | null {
    const clipboardData = clipboardEvent.clipboardData

    if (!clipboardData) {
      return null
    }

    for (const clipboardItem of Array.from(clipboardData.items)) {
      if (clipboardItem.kind !== 'file') {
        continue
      }

      if (!hasSupportedImageType(clipboardItem.type)) {
        continue
      }

      const clipboardImageFile = clipboardItem.getAsFile()
      if (!clipboardImageFile) {
        continue
      }

      return ensureFileName(clipboardImageFile)
    }

    for (const clipboardFile of Array.from(clipboardData.files)) {
      if (!hasSupportedImageType(clipboardFile.type)) {
        continue
      }

      return ensureFileName(clipboardFile)
    }

    return null
  }
}
