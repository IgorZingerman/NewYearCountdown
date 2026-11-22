import './globals.css'

export const metadata = {
  title: 'New Year Countdown',
  description: 'A festive countdown to the New Year with animations and celebrations',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
