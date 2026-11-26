import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Theme } from "@radix-ui/themes";

import "@radix-ui/themes/styles.css";
import "./globals.css";

import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  title: "Influencial",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Theme
          appearance="dark"
          accentColor="blue"
          grayColor="slate"
          radius="large"
        >
          <SiteHeader />
          {children}
        </Theme>
      </body>
    </html>
  );
}
