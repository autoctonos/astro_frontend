import { Link } from "@heroui/react";
import { TwitterIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export default function Footer() {
  return (
    <footer className="mt-10 w-full border-t border-custom-medium-green/30 bg-custom-dark-green/95 py-6 text-custom-cream">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6">
        <Link
          isExternal
          className="flex items-center gap-2 rounded-xl px-2 py-1 text-current transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-light-green"
          href="https://heroui.com?utm_source=next-app-template"
          title="heroui.com homepage"
        >
          <span>Powered by</span>
          <p className="font-semibold text-custom-light-green">Autóctonos</p>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            isExternal
            aria-label="Twitter"
            href={siteConfig.links.twitter}
            className="rounded-full p-1 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-light-green"
          >
            <TwitterIcon className="text-custom-light-green" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
