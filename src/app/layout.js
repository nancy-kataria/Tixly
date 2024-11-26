import localFont from "next/font/local";
import { getServerSession } from "next-auth";
import SessionWrapper from "./SessionWrapper";
import Navbar from "@/components/Navbar";
//import "@/styles/main.css";
import "./global.css"

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
  title: "Event Ticket Booking",
  description: "Generated by create next app",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionWrapper session={session}>
          <Navbar/>
            <main>{children}</main>
          </SessionWrapper>
      </body>
    </html>
  );
}
