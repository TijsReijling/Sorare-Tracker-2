import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sorare WC 2026 Tracker',
  description: 'Track your Sorare cards at the 2026 FIFA World Cup',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f9fafb' }}>{children}</body>
    </html>
  )
}
