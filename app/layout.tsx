import './globals.css'
import { Metadata } from 'next'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'ระบบบันทึกรายรับ-รายจ่าย (Expense Tracker)',
  description: 'ระบบจัดการรายรับ-รายจ่ายส่วนบุคคลพร้อมกราฟวิเคราะห์และระบบ Admin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="bg-slate-900 text-slate-100 min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
