import localFont from "next/font/local";

import Navbar from "@/components/Navbar";
import "./global.css";
import { UserProvider } from "@/context/UserContext";
import Footer from "@/components/Footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Tixly",
  description: "Buy, resell and transfer tickets to live events.",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans text-foreground antialiased`}
      >
        <UserProvider>
          <Navbar />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
