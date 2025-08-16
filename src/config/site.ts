
export const siteConfig = {
  links: {
    twitter: ".",
  },
  navItems: [
  ],
  navMenuItems: [
    { href: "/acerca", label: "Acerca de" },
    { href: "/faq", label: "Preguntas frecuentes" },
  ],
} as const satisfies {
  links: { twitter: string };
  navItems: Array<{ href: string; label: string }>;
  navMenuItems: Array<{ href: string; label: string }>;
};