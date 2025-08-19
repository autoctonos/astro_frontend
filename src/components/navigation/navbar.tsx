import { useRef, useState } from "react";
import { Navbar as HeroUINavbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuItem, Input, Button, Link, Spinner } from "@heroui/react";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { siteConfig } from "@/config/site";
import { HeartFilledIcon, MenuIcon, SearchIcon } from "@/components/icons";
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

  const [logoTip, setLogoTip] = useState(false);
  const cartCount = useCartCount();

  return (
    <HeroUINavbar
    maxWidth="full"
    position="sticky"
    className="sticky top-0 z-50 border-b border-custom-medium-green/30 bg-custom-cream/80 backdrop-blur-md supports-[backdrop-filter]:bg-custom-cream/60"
    isMenuOpen={isMenuOpen}
    onMenuOpenChange={setIsMenuOpen}
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
        <button
          className="lg:hidden ml-auto flex items-center justify-center h-10 w-10 rounded-lg hover:bg-custom-light-green/20 transition"
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <span className="text-2xl text-custom-dark-green">&times;</span>
          ) : (
            <MenuIcon className="h-6 w-6 text-custom-dark-green" />
          )}
        </button>
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
    <NavbarMenu 
      className="bg-custom-cream p-4 pt-8 backdrop-blur-lg w-full sm:w-80 fixed right-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-[1000]"
    >
      <div className="mb-6 mt-10">
        <div className="relative">
          <Input
            aria-label="Buscar productos"
            classNames={{
              inputWrapper: "bg-white border border-custom-medium-green/30 rounded-lg px-3 py-1",
              input: "text-sm text-custom-black pl-1"
            }}
            placeholder="Encuentra tu próximo producto..."
            startContent={<SearchIcon className="text-custom-medium-green w-4 h-4 flex-shrink-0" />} 
            value={query}
            onValueChange={setQuery}
          />
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-custom-medium-green uppercase tracking-wider mb-3">
          Categorías
        </h3>
        <Drop title="Explorar categorías" />
      </div>
      <div className="mt-6">
        <button
          onClick={() => {
            openCart();
            setIsMenuOpen(false); 
          }}
          className={clsx(
            "inline-flex items-center gap-2",
            "px-3 py-2 rounded-lg",
            "bg-custom-dark-green text-white",
            "text-sm font-medium",
            "hover:bg-custom-dark-green transition-colors",
            "relative"
          )}
          aria-label="Carrito de compras"
        >
          <CartIcon className="h-5 w-5" />
          <span>Carrito</span>
          {cartCount > 0 && (
            <span className="ml-2 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-custom-red text-white text-xs font-bold px-1">
              {cartCount}
            </span>
          )}
        </button>
      </div>
      <nav className="space-y-1">
        {navMenuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.href}-${index}`}>
            <Link
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-custom-dark-green hover:bg-custom-light-green/20 hover:text-custom-dark-green transition-colors"
              onPress={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </nav>
      <div className="mt-8 pt-4 border-t border-custom-medium-green/20">
        <Link
          href="/profile"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-custom-dark-green hover:bg-custom-light-green/20"
        >
          Mi perfil
        </Link>
        <Link
          href="/logout"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-custom-red hover:bg-custom-red/10"
        >
          Cerrar sesión
        </Link>
      </div>
    </NavbarMenu>
    </HeroUINavbar>
  );
}
