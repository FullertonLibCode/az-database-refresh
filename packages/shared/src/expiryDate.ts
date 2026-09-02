const BOLD_ELEMENT_PATTERN = /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
const BOLD_PARAGRAPH_PATTERN = /<p\b[^>]*>\s*<(strong|b)\b[^>]*>([\s\S]*?)<\/\1\s*>\s*<\/p\s*>/gi;
const AVAILABLE_PATTERN = /\bavailable\b/i;

export function findExpiryDateText(html: string): string | null {
  BOLD_ELEMENT_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BOLD_ELEMENT_PATTERN.exec(html)) !== null) {
    const text = htmlToPlainText(match[2] ?? "").trim();
    if (AVAILABLE_PATTERN.test(text)) return text;
  }
  return null;
}

export function removeExpiryDate(html: string): string {
  const withoutParagraph = html.replace(BOLD_PARAGRAPH_PATTERN, (element, _tag, contents) =>
    isAvailabilityText(contents) ? "" : element
  );
  return withoutParagraph
    .replace(BOLD_ELEMENT_PATTERN, (element, _tag, contents) =>
      isAvailabilityText(contents) ? "" : element
    )
    .trim();
}

export function setExpiryDate(html: string, included: boolean, text: string): string {
  const withoutExpiryDate = removeExpiryDate(html);
  const trimmedText = text.trim();
  if (!included || !trimmedText) return withoutExpiryDate;
  const expiryDateHtml = `<p><strong>${escapeHtml(trimmedText)}</strong></p>`;
  return `${withoutExpiryDate}${withoutExpiryDate ? "\n" : ""}${expiryDateHtml}`;
}

function isAvailabilityText(html: string): boolean {
  return AVAILABLE_PATTERN.test(htmlToPlainText(html));
}

function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ""));
}

function decodeHtmlEntities(text: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"'
  };
  return text.replace(/&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== "#") return namedEntities[code.toLowerCase()] ?? entity;
    const hexadecimal = code[1]?.toLowerCase() === "x";
    const value = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    const isValidCodePoint = Number.isFinite(value) && value >= 0 && value <= 0x10ffff
      && (value < 0xd800 || value > 0xdfff);
    return isValidCodePoint ? String.fromCodePoint(value) : entity;
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
