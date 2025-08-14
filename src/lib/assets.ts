export const ASSETS_ORIGIN =
  (import.meta.env.PUBLIC_ASSETS_ORIGIN || "").replace(/\/$/, "");

export function asset(path?: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path; 
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${ASSETS_ORIGIN}${p}`;
}
