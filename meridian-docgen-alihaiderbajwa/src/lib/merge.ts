const TOKEN_RE = /\{\{\s*([a-z0-9_]+)(?:\|([^}]*))?\s*\}\}/g;

export function mergeTemplate(
  body: string | null,
  values: Record<string, string>,
): string {
  if (!body) return "";
  return body.replace(TOKEN_RE, (_match, token: string, fallback?: string) => {
    const hasAnswer = token in values;
    if (!hasAnswer) {
      // Unknown token — not produced by any field in this form.
      if (fallback !== undefined && fallback.trim() !== "") return fallback;
      return _match;
    }
    const answer = values[token];
    if (answer && answer.trim() !== "") return answer;
    if (fallback !== undefined && fallback.trim() !== "") return fallback;
    return "[Not provided]";
  });
}

export function slugifyLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}
