import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechSpace AI ? News Curator & Short Script Generator',
  description: 'Automatically curate and summarize the latest tech and space news into a 60-second YouTube Short script with sources.',
  metadataBase: new URL('https://agentic-9e3e3d14.vercel.app')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
