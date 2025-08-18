
export const siteConfig = {
  links: {
    twitter: ".",
  },
  navItems: [
  ],
  navMenuItems: [
  ],
} as const satisfies {
  links: { twitter: string };
  navItems: Array<{ href: string; label: string }>;
  navMenuItems: Array<{ href: string; label: string }>;
};