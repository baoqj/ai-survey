import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: '智问数研 - AI智能问卷调研系统',
  description: '智问数研是一个以AI驱动的智能问卷调研平台，为企业客户提供高效、智能的数据收集与分析解决方案，同时为C端用户创造有价值的参与体验。',
  keywords: ['问卷调研', 'AI智能', '数据分析', '问卷系统', '调研平台'],
  authors: [{ name: '智问数研团队' }],
  creator: '智问数研',
  publisher: '智问数研',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://zhiwen-shuyuan.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '智问数研 - AI智能问卷调研系统',
    description: '以AI驱动的智能问卷调研平台，提供高效的数据收集与分析解决方案',
    url: 'https://zhiwen-shuyuan.com',
    siteName: '智问数研',
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '智问数研 - AI智能问卷调研系统',
    description: '以AI驱动的智能问卷调研平台，提供高效的数据收集与分析解决方案',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="智问数研" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}
