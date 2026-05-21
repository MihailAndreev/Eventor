export const allowedCoverImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxCoverImageSizeBytes = 5 * 1024 * 1024;

const extensionByMimeType: Record<(typeof allowedCoverImageTypes)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type CoverImageValidationResult =
  | { ok: true; mimeType: (typeof allowedCoverImageTypes)[number]; extension: string }
  | { ok: false; message: string };

export function validateCoverImageFile(file: File): CoverImageValidationResult {
  if (file.size <= 0) {
    return { ok: false, message: "Choose an image before saving." };
  }

  if (file.size > maxCoverImageSizeBytes) {
    return { ok: false, message: "Cover images must be 5 MB or smaller." };
  }

  if (!isAllowedCoverImageType(file.type)) {
    return {
      ok: false,
      message: "Cover images must be JPEG, PNG, or WebP files.",
    };
  }

  return { ok: true, mimeType: file.type, extension: extensionByMimeType[file.type] };
}

export function isAllowedCoverImageType(
  value: string,
): value is (typeof allowedCoverImageTypes)[number] {
  return allowedCoverImageTypes.includes(
    value as (typeof allowedCoverImageTypes)[number],
  );
}
