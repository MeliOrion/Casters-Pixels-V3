import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import './globals.css';

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
