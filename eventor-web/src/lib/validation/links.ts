export type EventLinkInput = {
  title: string;
  url: string;
};

export type EventLinkValidationResult =
  | { ok: true; title: string; url: string }
  | { ok: false; message: string };

export function validateEventLinkInput(input: EventLinkInput): EventLinkValidationResult {
  const title = input.title.trim();
  const url = input.url.trim();

  if (title.length === 0) {
    return { ok: false, message: "Enter a link title." };
  }

  if (title.length > 180) {
    return { ok: false, message: "Link titles must be 180 characters or less." };
  }

  if (url.length === 0) {
    return { ok: false, message: "Enter a link URL." };
  }

  if (url.length > 2048) {
    return { ok: false, message: "Link URLs must be 2048 characters or less." };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return { ok: false, message: "Enter a valid http or https URL." };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { ok: false, message: "Enter a valid http or https URL." };
  }

  return { ok: true, title, url: parsedUrl.toString() };
}
