
import type { PropsWithChildren } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
