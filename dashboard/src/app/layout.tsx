import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "locomotive-scroll/locomotive-scroll.css";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Semantic Load Balancer",
  description: "L8 Intent-Based Routing Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function () {
              try {
                var key = "semantic-lb:scroll:" + window.location.pathname + window.location.search;
                var stored = window.sessionStorage.getItem(key);
                var y = stored ? Number.parseFloat(stored) : 0;
                window.history.scrollRestoration = "manual";

                if (!Number.isFinite(y) || y <= 0) return;

                document.documentElement.dataset.restoringScroll = "true";

                var restore = function () {
                  window.scrollTo(0, y);
                };

                restore();
                if (document.readyState === "loading") {
                  document.addEventListener("DOMContentLoaded", restore, { once: true });
                }
                window.requestAnimationFrame(restore);
              } catch (_) {}
            })();
          `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
