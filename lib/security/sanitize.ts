const controlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const dangerousHtml = /<\s*\/?\s*(script|iframe|object|embed|link|meta|style|svg|math)[^>]*>/gi;
const eventHandlers = /\son[a-z]+\s*=\s*(['"]).*?\1/gi;
const javascriptUrls = /javascript\s*:/gi;

export function sanitizeText(value: string) {
  return value
    .replace(controlCharacters, "")
    .replace(dangerousHtml, "")
    .replace(eventHandlers, "")
    .replace(javascriptUrls, "")
    .trim();
}

export function sanitizeUnknown(input: unknown): unknown {
  if (typeof input === "string") {
    return sanitizeText(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeUnknown(item));
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [
        key,
        sanitizeUnknown(value)
      ])
    );
  }

  return input;
}
