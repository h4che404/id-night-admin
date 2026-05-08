import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ID-Night Admin",
  description: "Consola administrativa profesional para control operativo, trazabilidad y supervision en venues nocturnos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
