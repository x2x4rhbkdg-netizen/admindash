/** =========================================
 *  APP: Root layout
 *  ========================================= */
import "./globals.css";

export const metadata = { title: "758 Admin" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}