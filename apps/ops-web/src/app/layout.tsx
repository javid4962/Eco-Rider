import React from 'react';

export const metadata = {
  title: 'EcoRide Ops Portal',
  description: 'EV Mobility Operations Portal for Andhra Pradesh',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0b132b', color: '#ffffff' }}>
        {children}
      </body>
    </html>
  );
}

