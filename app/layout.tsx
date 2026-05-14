import type { Metadata, Viewport } from 'next'
import { Share_Tech_Mono, Rajdhani } from 'next/font/google'
import './globals.css'

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-share-tech-mono',
})

const rajdhani = Rajdhani({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
})

export const metadata: Metadata = {
  title: 'ENCLAVE // UNIFIED APPLICATION PORTAL',
  description: 'Enclave — Self-hosted unified application portal powered by Venator UI',
  icons: {
    icon: '/enclave-favicon-32.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0800',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${shareTechMono.variable} ${rajdhani.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
