import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-provider"
import { Toaster } from "sonner"
import { ReactQueryProvider } from "@/lib/react-query-provider"
import { HelpBubble } from "@/components/help/help-bubble"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CMIGL Escrow Services",
  description: "Secure transactions between buyers and sellers",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} w-full`}>
        <ReactQueryProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              <HelpBubble />
              <Toaster
                className="group toaster"
                toastOptions={{
                  classNames: {
                    toast:
                      "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    title: "group-[.toast]:text-foreground font-semibold",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    success:
                      "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-green-700 group-[.toaster]:to-green-800 group-[.toaster]:text-white group-[.toaster]:border-green-600",
                    error:
                      "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-red-700 group-[.toaster]:to-red-800 group-[.toaster]:text-white group-[.toaster]:border-red-900",
                    warning:
                      "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-yellow-500 group-[.toaster]:to-amber-500 group-[.toaster]:text-zinc-900 group-[.toaster]:border-amber-500",
                    info: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-yellow-600 group-[.toaster]:to-yellow-700 group-[.toaster]:text-zinc-900 group-[.toaster]:border-yellow-500",
                    default:
                      "group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-50 group-[.toaster]:border-zinc-800",
                  },
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
