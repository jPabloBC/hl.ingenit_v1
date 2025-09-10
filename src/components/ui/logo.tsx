import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showLink?: boolean;
}

/**
 * Componente Logo reutilizable para INGENIT
 * 
 * @param variant - Variante del logo: "default" (azul/dorado) o "white" (blanco)
 * @param size - Tamaño del logo: "sm", "md", "lg", "xl"
 * @param className - Clases CSS adicionales
 * @param showLink - Si debe incluir un enlace a la página principal
 * 
 * @example
 * // Logo principal en header
 * <Logo variant="default" size="lg" />
 * 
 * // Logo blanco en footer
 * <Logo variant="white" size="md" showLink={false} />
 * 
 * // Logo pequeño sin enlace
 * <Logo variant="default" size="sm" showLink={false} />
 */
export default function Logo({ 
  variant = "default", 
  size = "md", 
  className = "",
  showLink = true 
}: LogoProps) {
  const logoConfig = {
    default: {
      src: "/assets/icon_ingenIT.png",
      alt: "INGENIT Logo"
    },
    white: {
      src: "/assets/logo_transparent_ingenIT_white.png",
      alt: "INGENIT Logo White"
    }
  };

  const sizeConfig = {
    sm: { width: 80, height: 24, className: "h-6 w-auto" },
    md: { width: 100, height: 28, className: "h-8 w-auto sm:h-10" },
    lg: { width: 120, height: 32, className: "h-10 w-auto sm:h-12" },
    xl: { width: 140, height: 36, className: "h-12 w-auto sm:h-14 md:h-16" }
  };

  const config = logoConfig[variant];
  const sizeProps = sizeConfig[size];

  const logoElement = (
    <Image
      src={config.src}
      alt={config.alt}
      width={sizeProps.width}
      height={sizeProps.height}
      className={`${sizeProps.className} ${className}`}
      priority={size === "lg" || size === "xl"}
    />
  );

  if (showLink) {
    return (
      <Link href="/" className="flex items-center">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}