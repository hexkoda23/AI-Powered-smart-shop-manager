import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-light' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-dark' })

export const metadata: Metadata = {
  title: 'Notable AI Shop Assistant',
  description: 'AI-powered shop management system for tracking sales, stock, and business insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
