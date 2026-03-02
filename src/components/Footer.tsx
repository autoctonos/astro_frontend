import { Link } from "@heroui/react";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const footerSections: Record<string, FooterLink[]> = {
  Tienda: [
    { label: "Todos los productos", href: "/" },
    { label: "Categorías", href: "#" },
  ],
  Compañía: [
    { label: "Nuestros productores", href: "/producers" },
    { label: "Contacto", href: "#" },
  ],
  Redes: [
    { label: "Instagram", href: "#" },
    { label: "Facebook", href: "#" },
    { label: "X (Twitter)", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-10 w-full border-t border-custom-medium-green/30 bg-custom-dark-green/98 text-custom-cream">
      <div className="container-ecommerce py-10 md:py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Marca + newsletter */}
          <div className="space-y-5 lg:col-span-2">
            <a
              href="/"
              className="group flex items-center gap-3 rounded-xl p-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              aria-label="Autóctonos - inicio"
            >
              <img
                src="/logo.svg"
                alt="Autóctonos"
                className="h-10 w-10 drop-shadow-sm transition-all group-hover:drop-shadow-md"
              />
              <span className="font-serif text-lg font-semibold tracking-tight text-custom-cream">
                Autóctonos
              </span>
            </a>

            <p className="max-w-md text-sm leading-relaxed text-custom-cream/80">
              Conectamos productores artesanales con <br />consumidores conscientes. 
              Del campo a tu mesa, con <br /> calidad y tradición.
            </p>
          </div>

          {/* Secciones de enlaces */}
          {Object.entries(footerSections).map(([sectionTitle, links]) => (
            <nav key={sectionTitle} aria-label={sectionTitle}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-custom-light-green">
                {sectionTitle}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      isExternal={link.external}
                      className="text-sm text-custom-cream/80 transition-colors hover:text-custom-light-green"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Barra inferior */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 border-t border-custom-medium-green/30 pt-6 text-xs text-custom-cream/70 sm:flex-row">
          <p className="text-center sm:text-left">
            &copy; 2026 Autóctonos. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
