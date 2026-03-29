import "./globals.css";

export const metadata = {
  title: "BuildMyOutfit — AI Outfit Builder",
  description:
    "Upload a photo, detect colors, and get curated outfit recommendations from top brands. Free AI-powered outfit builder.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}