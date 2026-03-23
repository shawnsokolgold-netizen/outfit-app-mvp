export const metadata = {
  title: "Outfit App MVP",
  description: "Starter app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}