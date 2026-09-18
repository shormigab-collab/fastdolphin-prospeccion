// Usa el archivo de logo original tal cual (public/fast-dolphin-logo.png),
// sin redibujarlo ni recolorearlo. <img> normal en vez de next/image para
// evitar cualquier reprocesamiento del archivo.
export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/fast-dolphin-logo.png"
      alt="Fast Dolphin"
      className={className}
      width={501}
      height={188}
    />
  );
}
