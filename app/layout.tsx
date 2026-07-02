import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import AppShell from '@/components/ui/AppShell'

export const metadata: Metadata = {
  title: 'Options Auto Trader',
  description: 'NIFTY & SENSEX Options Auto Trading Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
