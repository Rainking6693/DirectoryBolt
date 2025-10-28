import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'DirectoryBolt - Automated Directory Submissions',
  description: 'AI-powered directory submission automation platform. Submit your business to 800+ directories with one click.',
  keywords: 'directory submission, SEO, business listings, automation, AI',
  authors: [{ name: 'DirectoryBolt' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
