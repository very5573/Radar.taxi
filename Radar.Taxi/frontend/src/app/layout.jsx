import "./globals.css";
import Providers from "./providers";
import ClientLayout from "./Clientlayout";
import BottomNav from "./components/BottomNav";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="w-full h-full bg-gray-900">

        <Providers>

          <ClientLayout>

            <div className="pb-20">
              {children}
            </div>

            {/* ✅ BottomNav INSIDE Provider */}
            <BottomNav />

          </ClientLayout>

        </Providers>

      </body>
    </html>
  );
}