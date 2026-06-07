import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dmsans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drucka — Print it. Gift it. Feel it.",
  description:
    "Drucka — premium custom printing & gifting studio. Upload your photo or design and turn it into T-shirts, mugs, frames, cushions, canvas and personalized gifts.",
  openGraph: {
    title: "Drucka — Print it. Gift it. Feel it.",
    description:
      "Premium custom printing & gifting studio. Upload your design and order T-shirts, mugs, frames, cushions, canvas and personalized gifts.",
    type: "website",
  },
  // TODO: add favicon via app/icon.png and og:image once brand assets exist.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
