"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background text-muted-foreground">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row md:px-6">
        <div className="text-center text-sm sm:text-left">
          &copy; {new Date().getFullYear()} Ticketopia. All rights reserved.
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-sm hover:text-primary hover:underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="text-sm hover:text-primary hover:underline underline-offset-4"
          >
            Terms of Service
          </Link>
        </nav>
        <div className="text-sm text-muted-foreground">v1.0.0</div>
      </div>
    </footer>
  );
}
