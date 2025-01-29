import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import './globals.css';
import '../styles/neon.css';

export const metadata = {
  title: 'Casters Pixels',
  description: 'Generate unique NFT profile pictures using AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="neon-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
