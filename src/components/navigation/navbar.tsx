import { useRef, useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
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
  const boxRef = useRef<HTMLDivElement | null>(null);

  const { results, loading } = useProductosSearch(query, 2);
  const navItems = (siteConfig.navItems as NavItem[]) ?? [];
  const navMenuItems = (siteConfig.navMenuItems as NavItem[]) ?? [];

  const [logoTip, setLogoTip] = useState(false);
  const cartCount = useCartCount();

  return (
    <HeroUINavbar
      maxWidth="full"
      position="sticky"
      className="sticky top-0 z-50 bg-custom-cream border-b border-custom-medium-green/20 shadow-sm"
    >

      <NavbarContent className="container-ecommerce flex items-center justify-between h-16" justify="start">
        <NavbarBrand className="flex-shrink-0">
          <a
            href="/"
              className="group relative flex items-center gap-2 rounded-xl p-1 transition-transform hover:scale-105 active:scale-95"
              onMouseEnter={() => setLogoTip(true)}
              onMouseLeave={() => setLogoTip(false)}
              aria-label="Autóctonos"
          >
            <img
              src="/logo.svg"
              alt="Autóctonos"
              className="h-10 w-10 drop-shadow-sm group-hover:drop-shadow-md transition-all"
            />
            <span className="hidden sm:block font-semibold text-lg text-custom-dark-green tracking-tight">
              Autóctonos
            </span>
          </a>
        </NavbarBrand>
        <ul className="ml-2 hidden gap-3 lg:flex">
          {navItems.map((item) => (
            <NavbarItem key={item.href}>
              <a
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "rounded-lg px-3 py-2 text-sm font-medium text-custom-dark-green/90 transition-all hover:bg-custom-light-green/20 hover:text-custom-dark-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
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
      
        <NavbarItem className="hidden lg:flex flex-1 max-w-2xl mx-4">
          <div
            ref={boxRef}
            className="relative w-full lg:w-[380px]"
            onFocus={() => results.length && setOpenList(true)}
            onBlur={(e) => {
              if (!boxRef.current?.contains(e.relatedTarget as Node)) setOpenList(false);
            }}
          >
            <div className="relative flex items-center">
              <Input
                aria-label="Buscar productos"
                classNames={{
                  inputWrapper:
                    "group bg-custom-cream/70 border border-custom-medium-green/40 rounded-full shadow-sm transition-all hover:shadow-md focus-within:border-custom-medium-green focus-within:shadow-lg px-3 py-1",
                  input:
                    "text-sm text-custom-black placeholder:text-custom-black/60 pl-1", 
                }}
                value={query}
                onValueChange={(v) => {
                  setQuery(v);
                  if (!openList) setOpenList(true);
                }}
                placeholder="Encuentra tu próximo producto…"
                startContent={
                  <SearchIcon className="text-custom-medium-green w-4 h-4 flex-shrink-0" /> 
                }
                type="search"
              />
            </div>

            {openList && (loading || results.length > 0) && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-2xl border border-custom-medium-green/30 bg-custom-dark-green shadow-xl">
                {loading ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-white">
                    <Spinner size="sm" className="text-custom-light-green" />
                    Buscando…
                  </div>
                ) : (
                  <ul
                    role="listbox"
                    className="max-h-80 overflow-auto scroll-py-2 text-white"
                    aria-label="Resultados de búsqueda"
                  >
                    <SearchResults 
                      items={results} 
                      onItemClick={() => setOpenList(false)}
                    />
                  </ul>
                )}
              </div>
            )}
          </div>
        </NavbarItem>

        <NavbarContent className="gap-2" justify="end">
          <NavbarItem className="hidden sm:flex">
            <Button
              as="a"
              href="/producers"
              className="btn-primary flex items-center gap-1.5"
              startContent={<HeartFilledIcon className="text-custom-red h-4 w-4" />}
            >
              Nuestros Productores
            </Button>
          </NavbarItem>
          <NavbarItem className="hidden sm:flex">
            <button
              onClick={() => openCart()}
              className={clsx(
                "btn-primary",
                "flex items-center justify-center", 
                "relative",
                "h-10 px-3", 
                "overflow-visible",
                "transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                "group"
              )}
              aria-label="Carrito de compras"
            >
              <div className="relative flex items-center justify-center h-5 w-5">
                <CartIcon className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
                {cartCount > 0 && (
                  <span className={clsx(
                    "absolute -top-2 -right-2",
                    "flex items-center justify-center",
                    "min-w-[18px] h-[18px]",
                    "rounded-full",
                    "bg-custom-red text-white",
                    "text-[10px] font-bold",
                    "shadow-xs",
                    "transform transition-all",
                    "group-hover:scale-110 group-hover:shadow-sm",
                    "border border-custom-cream"
                  )}>
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-white hidden sm:inline-block">
                Carrito
              </span>
            </button>
          </NavbarItem>
        </NavbarContent>
      </NavbarContent>


      {/* Menú hamburguesa */}
      <NavbarMenu className="bg-custom-cream/95 p-3">
        <div className="mb-3">
          <div className="relative">
            <div className="relative flex items-center">
              <Input
                aria-label="Buscar productos"
                classNames={{
                  inputWrapper:
                    "group data-[hover=true]:bg-custom-cream/70 bg-custom-cream/60 w-full border border-custom-medium-green/40 shadow-sm transition focus-within:border-custom-medium-green focus-within:shadow-md",
                  input: "text-sm text-custom-black placeholder:text-custom-black/50",
                }}
                value={query}
                onValueChange={(v) => setQuery(v)}
                placeholder="Buscar…"
                startContent={
                  <span className="text-custom-medium-green">
                    <SearchIcon />
                  </span>
                }
                type="search"
              />
            </div>
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
