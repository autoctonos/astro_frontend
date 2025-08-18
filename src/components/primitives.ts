type Opt = { class?: string; color?: "red" | "green" };

export function title(opt: Opt = {}) {
  const base = "font-extrabold tracking-tight";
  const size = "text-3xl md:text-5xl";
  const color =
    opt.color === "red"
      ? "text-[#BC4745]"
      : opt.color === "green"
      ? "text-custom-dark-green"
      : "text-custom-dark-green";
      
  return [base, size, color, opt.class].filter(Boolean).join(" ");
}

export function subtitle(opt: Opt = {}) {
  const base = "text-base md:text-lg";
  const color = "text-custom-black/80";
  return [base, color, opt.class].filter(Boolean).join(" ");
}
