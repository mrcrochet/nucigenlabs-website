import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import React from 'react';

export const metadata: Metadata = {
  title: 'NuciGen Labs',
  description: 'NuciGen Labs - Advanced intelligence platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
