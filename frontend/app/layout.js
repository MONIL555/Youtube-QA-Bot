import './globals.css';
import { Outfit } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../lib/authContext';
import { AppProvider } from '../lib/appContext';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata = {
  title: 'FIY-Talks — The Ultimate AI Q&A',
  description: 'Your personal AI assistant for YouTube, Instagram, and Documents.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <AuthProvider>
          <AppProvider>
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#ffffff',
                  color: '#0F172A',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(24px)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                },
              }}
            />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
