import Link from "next/link";
import { Home, Package, BarChart3, Settings } from "lucide-react";
import Image from "next/image";

const navItems = [
  { href: "/", icon: Home, label: "Inicio", mobileOnly: false },
  {
    href: "/stockEntry",
    icon: Package,
    label: "Cargar Stock",
    mobileOnly: true,
  },
  {
    href: "/dashboard",
    icon: BarChart3,
    label: "Ver Datos",
    desktopOnly: true,
  },
  { href: "/admin", icon: Settings, label: "Admin", desktopOnly: true },
];

const mobileItems = navItems.filter((item) => !item.desktopOnly);
const desktopItems = navItems.filter((item) => !item.mobileOnly);

const Navbar = ({ children }) => {
  return (
    <div className="bg-background flex flex-col">
      {/* Header - Desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-blue-800 text-primary-foreground shadow-md">
        <div className="flex items-center gap-4">
          <Image
            width={100}
            height={100}
            src="/tredi-blanco.png"
            alt="Trédi Argentina"
            className="h-12 w-auto"
          />
        </div>
        <nav className="flex items-center gap-2">
          {desktopItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-[#e07026] font-medium hover:bg-[#c65b1f] text-white"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      {/* Header - Mobile */}
      <header className="md:hidden flex items-center justify-center px-4 py-3 bg-blue-800 text-primary-foreground shadow-md">
        <Image
          width={300}
          height={300}
          src="/tredi-blanco.png"
          alt="Trédi Argentina"
          className="h-16  w-auto"
        />
      </header>

      {/* Main Content */}
      <main className="pb-6">{children}</main>

      {/* Bottom Navigation - Mobile (solo Inicio y Cargar Stock) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-800 border-t border-border shadow-lg">
        <div className="flex justify-around items-center py-2">
          {mobileItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors min-w-20 font-medium text-white"
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
