const CLAUSE_UI_NOISE = [
  "اتفاقية الشراكة والعمولة",
  "بنود الاتفاقية",
  "إعادة تعيين من القالب",
];

function stripHtml(input: string): string {
  return input
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|ul|ol)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ");
}

function isNoise(line: string): boolean {
  if (!line) return true;
  if (CLAUSE_UI_NOISE.includes(line)) return true;
  if (/^\d+$/.test(line)) return true;
  if (/^البند رقم\s+\d+$/i.test(line)) return true;
  return false;
}

export function extractAgreementClauses(input: string | null | undefined): string[] {
  if (!input) return [];

  return stripHtml(input)
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^\s*(?:\d+|[٠-٩]+)[\.\)\-–—:]\s*/, ""))
    .map((line) => line.replace(/^\s*[-•*]\s*/, ""))
    .filter((line) => !isNoise(line));
}