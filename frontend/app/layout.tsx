import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MAD-LLM Hub',
  description: 'Multi-AI Collaboration Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-primary font-sans">
        {children}
      </body>
    </html>
  )
}
