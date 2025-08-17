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
import { useProductosSearch } from "@/hooks/useProductosSearch";
import SearchResults from "@/components/SearchResults";
import { CartIcon } from "@/components/icons";
import { openCart, useCartCount } from "@/stores/cart";

type NavItem = { href: string; label: string };

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const { results, loading } = useProductosSearch(query, 2);
  const navItems = (siteConfig.navItems as NavItem[]) ?? [];
  const navMenuItems = (siteConfig.navMenuItems as NavItem[]) ?? [];

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      className="sticky top-0 z-50 border-b border-custom-medium-green/30 bg-custom-cream/80 backdrop-blur-md supports-[backdrop-filter]:bg-custom-cream/60"
      onMenuOpenChange={setIsMenuOpen}
    >

      <NavbarContent className="basis-1/4 sm:basis-full" justify="start">
        <NavbarMenuToggle
          className="mr-2 lg:hidden"
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        />
        <NavbarBrand as="li" className="max-w-fit">
          <a
            className="group flex items-center gap-2 rounded-2xl p-1 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
            href="/"
            aria-label="Inicio"
          >
            <img src="/logo.svg" alt="Autóctonos" height={44} width={44} />
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

      <NavbarContent className="sm:hidden" justify="end">
        <NavbarItem>
          <button
            onClick={() => openCart()}
            className="relative rounded-xl p-2 transition hover:bg-custom-light-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
            aria-label="Abrir carrito"
          >
            <CartIcon />
            {useCartCount() > 0 && (
              <span
                className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-custom-red px-1 text-[10px] font-semibold text-white"
                aria-label="Cantidad en carrito"
              >
                {useCartCount()}
              </span>
            )}
          </button>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="hidden basis-1/5 sm:flex sm:basis-full" justify="end">
        <NavbarItem className="hidden lg:flex">
          <div
            ref={boxRef}
            className="relative w-full lg:w-[480px]"
            onFocus={() => results.length && setOpenList(true)}
            onBlur={(e) => {
              if (!boxRef.current?.contains(e.relatedTarget as Node)) setOpenList(false);
            }}
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
              isClearable
              onClear={() => {
                setQuery("");
                setOpenList(false);
              }}
              labelPlacement="outside"
              placeholder="Encuentra tu próximo producto…"
              startContent={
                <span className="text-custom-medium-green">
                  <SearchIcon />
                </span>
              }
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
          <NavbarItem className="hidden md:flex">
            <button
              onClick={() => openCart()}
              className="relative rounded-xl p-2 transition hover:bg-custom-light-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
              aria-label="Abrir carrito"
            >
              <CartIcon />
              {useCartCount() > 0 && (
                <span
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-custom-red px-1 text-[10px] font-semibold text-white"
                  aria-label="Cantidad en carrito"
                >
                  {useCartCount()}
                </span>
              )}
            </button>
          </NavbarItem>

        </NavbarItem>

        <NavbarItem className="hidden sm:flex gap-2">
          <a
            href="/producers"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
          >
            <Button
              className="bg-custom-dark-green text-custom-cream transition hover:bg-custom-medium-green"
              startContent={<HeartFilledIcon className="text-custom-red" />}
              size="sm"
              variant="solid"
            >
              Nuestros Productores
            </Button>
          </a>
        </NavbarItem>

        <NavbarItem className="hidden md:flex">
        </NavbarItem>
      </NavbarContent>


      {/* Menú hamburguesa */}
      <NavbarMenu className="bg-custom-cream/95 p-3">
        <div className="mb-3">
          <div className="relative">
            <Input
              aria-label="Buscar productos"
              classNames={{
                inputWrapper:
                  "group data-[hover=true]:bg-custom-cream/70 bg-custom-cream/60 w-full border border-custom-medium-green/40 shadow-sm transition focus-within:border-custom-medium-green focus-within:shadow-md",
                input: "text-sm text-custom-black placeholder:text-custom-black/50",
              }}
              value={query}
              onValueChange={(v) => setQuery(v)}
              isClearable
              onClear={() => setQuery("")}
              placeholder="Buscar…"
              startContent={
                <span className="text-custom-medium-green">
                  <SearchIcon />
                </span>
              }
              type="search"
            />
            {(loading || results.length > 0) && query && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-2xl border border-custom-medium-green/30 bg-white shadow-xl">
                {loading ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-gray-600">
                    <Spinner size="sm" /> Buscando…
                  </div>
                ) : (
                  <ul role="listbox" className="max-h-80 overflow-auto scroll-py-2">
                    <SearchResults items={results} onItemClick={() => (setQuery(""), setOpenList(false))} />
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-2">
          <Drop title="Categorías" />
        </div>

        <div className="mx-1 mt-1 flex flex-col gap-1">
          {navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.href}-${index}`}>
              <Link
                href={item.href}
                size="lg"
                className="rounded-xl px-2 py-1 text-custom-dark-green transition hover:bg-custom-light-green/10 hover:text-custom-dark-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
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
