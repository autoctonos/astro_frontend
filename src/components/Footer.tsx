import { Link } from "@heroui/react";
import { TwitterIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export default function Footer() {
  return (
    <footer className="mt-10 w-full border-t border-custom-dark-green/10 bg-custom-cream py-6 text-custom-black">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6">
        <Link
          isExternal
          className="flex items-center gap-2 rounded-xl px-2 py-1 text-current transition hover:text-custom-dark-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
          href="https://heroui.com?utm_source=next-app-template"
          title="heroui.com homepage"
        >
          <span>Powered by</span>
          <p className="font-semibold text-custom-dark-green">Autóctonos</p>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            isExternal
            aria-label="Twitter"
            href={siteConfig.links.twitter}
            className="rounded-full p-1 transition hover:text-custom-dark-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
          >
            <TwitterIcon className="text-custom-dark-green" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
