import { useEffect, useState } from "react";
import { fetchProductosConImagenes } from "@/api/products";
import type { Producto } from "@/api/schemas/products";
import { useDebouncedValue } from "./useDebouncedValue";

export function useProductosSearch(query: string, minLen = 2) {
  const [results, setResults] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebouncedValue(query, 300);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (debounced.trim().length < minLen) {
        if (alive) setResults([]);
        return;
      }
      setLoading(true);
      try {
        const arr = await fetchProductosConImagenes();
        const q = debounced.toLowerCase();
        const filtered = arr.filter((p) => p.nombre.toLowerCase().includes(q));
        if (alive) setResults(filtered);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [debounced, minLen]);

  return { results, loading };
}
