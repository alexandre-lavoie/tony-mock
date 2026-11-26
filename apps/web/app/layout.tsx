import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Theme } from "@radix-ui/themes";

import "@radix-ui/themes/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Influencial",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Theme accentColor="blue" grayColor="slate" radius="large">
          {children}
        </Theme>
      </body>
    </html>
  );
}
