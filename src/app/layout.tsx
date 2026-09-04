import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Enterprise Time Attendance | Tier 1 Suite',
  description:
    'Modern minimalist fluid Time & Attendance Enterprise platform with Neon PostgreSQL, Bulk Excel processing, and multi-role RBAC.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="bg-[#0b0f19] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
