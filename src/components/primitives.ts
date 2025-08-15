type Opt = { class?: string; color?: "red" | "green" };

export function title(opt: Opt = {}) {
  const base = "font-extrabold tracking-tight";
  const size = "text-4xl md:text-6xl";
  const color =
    opt.color === "red"
      ? "text-custom-red"
      : opt.color === "green"
      ? "text-custom-dark-green"
      : "text-custom-black";
  return [base, size, color, opt.class].filter(Boolean).join(" ");
}

export function subtitle(opt: Opt = {}) {
  const base = "text-lg md:text-xl";
  const color = "text-custom-black/70";
  return [base, color, opt.class].filter(Boolean).join(" ");
}
