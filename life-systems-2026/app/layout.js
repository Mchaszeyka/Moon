export const metadata = {
  title: "Life Systems 2026",
  description: "Private life operations dashboard",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
