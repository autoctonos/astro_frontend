export function slugify(input: string) {
    return (input || "")
      .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/ñ/g, "n")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .replace(/-{2,}/g, "-");
  }
  
  /** Extrae el id al final del slug: "cafe-especial-7" -> "7" */
  export function idFromCategorySlug(slug: string): string | null {
    const m = String(slug || "").match(/-(\d+|[a-f0-9]{8,})$/i);
    return m ? m[1] : null;
  }
  
  export function categorySlug(name: string, id: string|number) {
    return `${slugify(name || String(id))}-${id}`;
  }
  