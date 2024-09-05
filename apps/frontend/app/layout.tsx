import { cn } from "@/lib/utils";
import { Inter as FontSans, PT_Serif } from "next/font/google";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = PT_Serif({
  weight: ["400", "700"],
  variable: "--font-serif",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full !overflow-auto">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased h-fit",
          fontSans.variable,
          fontSerif.variable
        )}
      ></body>
    </html>
  );
}
