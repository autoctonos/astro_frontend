/** "Lácteos / Quesos" → "lacteos-quesos". Mismo resultado que `django.utils.text.slugify`. */
export function slugify(input: string) {
  return (input || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
