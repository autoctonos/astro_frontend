import { useRef, useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Input,
  Button,
  Link,
  Spinner,
} from "@heroui/react";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { siteConfig } from "@/config/site";
import { HeartFilledIcon, SearchIcon } from "@/components/icons";
import Drop from "@/components/common/dropdown";
import ShopSiderBar from "@/components/common/shop-sidebar";
import { useProductosSearch } from "@/hooks/useProductosSearch";
import SearchResults from "@/components/SearchResults";

type NavItem = { href: string; label: string };

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const { results, loading } = useProductosSearch(query, 2);
  const navItems = (siteConfig.navItems as NavItem[]) ?? [];
  const navMenuItems = (siteConfig.navMenuItems as NavItem[]) ?? [];

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      className="sticky top-0 z-50 border-b border-custom-medium-green/30 bg-custom-cream/80 backdrop-blur-md supports-[backdrop-filter]:bg-custom-cream/60"
    >
      <NavbarContent className="basis-1/4 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="max-w-fit">
          <a
            className="group flex items-center gap-2 rounded-2xl p-1 ring-0 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
            href="/"
            aria-label="Inicio"
          >
            <img src="/logo.svg" alt="Autóctonos" height={48} width={48} />
            <span className="sr-only">Autóctonos</span>
          </a>
        </NavbarBrand>

        <ul className="ml-2 hidden gap-3 lg:flex">
          {navItems.map((item) => (
            <NavbarItem key={item.href}>
              <a
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "rounded-xl px-2 py-1 text-sm transition hover:text-custom-dark-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green data-[active=true]:font-semibold data-[active=true]:text-custom-dark-green"
                )}
                href={item.href}
              >
                {item.label}
              </a>
            </NavbarItem>
          ))}
        </ul>

        <NavbarItem>
          <ul className="hidden lg:flex">
            <Drop title="Categorías" />
          </ul>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="hidden basis-1/5 sm:flex sm:basis-full" justify="end">
        <NavbarItem className="hidden lg:flex">
          <div
            ref={boxRef}
            className="relative w-full lg:w-[480px]"
            onFocus={() => results.length && setOpenList(true)}
          >
            <Input
              aria-label="Buscar productos"
              classNames={{
                inputWrapper:
                  "group data-[hover=true]:bg-custom-cream/70 bg-custom-cream/60 w-full border border-custom-medium-green/40 shadow-sm transition focus-within:border-custom-medium-green focus-within:shadow-md",
                input: "text-sm text-custom-black placeholder:text-custom-black/50",
              }}
              value={query}
              onValueChange={(v) => {
                setQuery(v);
                if (!openList) setOpenList(true);
              }}
              labelPlacement="outside"
              placeholder="Encuentra tu próximo producto…"
              startContent={<span className="text-custom-medium-green">
                <SearchIcon />
              </span>}
              type="search"
            />

            {openList && (loading || results.length > 0) && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-2xl border border-custom-medium-green/30 bg-white shadow-xl">
                {loading ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-gray-600">
                    <Spinner size="sm" /> Buscando…
                  </div>
                ) : (
                  <ul
                    role="listbox"
                    className="max-h-80 overflow-auto scroll-py-2"
                    aria-label="Resultados de búsqueda"
                  >
                    <SearchResults items={results} onItemClick={() => setOpenList(false)} />
                  </ul>
                )}
              </div>
            )}
          </div>
        </NavbarItem>

        <NavbarItem className="hidden sm:flex gap-2">
          <a
            href="/producers"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
          >
            <Button
              className="bg-custom-dark-green text-custom-cream transition hover:bg-custom-medium-green"
              startContent={<HeartFilledIcon className="text-custom-red" />}              size="sm"
              variant="solid"
            >
              Nuestros Productores
            </Button>
          </a>
        </NavbarItem>

        <NavbarItem className="hidden md:flex">
          <ShopSiderBar />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="basis-1 pl-2 sm:hidden" justify="end">
        <NavbarMenuToggle className="text-custom-dark-green" />
      </NavbarContent>

      <NavbarMenu className="bg-custom-cream/95 p-2">
        <div className="mx-2 mt-1 flex flex-col gap-1">
          {navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.href}-${index}`}>
              <Link
                href={item.href}
                size="lg"
                className="rounded-xl px-2 py-1 text-custom-dark-green transition hover:bg-custom-light-green/10 hover:text-custom-dark-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
                color={
                  index === 2
                    ? "primary"
                    : index === navMenuItems.length - 1
                    ? "danger"
                    : "foreground"
                }
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
}
