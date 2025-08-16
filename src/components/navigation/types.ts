export interface NavItem {
  href: string;
  label: string;
}

export interface Product {
  id_producto: string;
  nombre: string;
  precio: number;
  imagenes?: Array<{
    url_imagen: string;
  }>;
}

export interface NavbarProps {
  navItems?: NavItem[];
  navMenuItems?: NavItem[];
}