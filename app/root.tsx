import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { LinksFunction } from "react-router";
import { ThemeProvider } from "@/components/app/theme-provider";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { usePressRipple } from "@/lib/use-press-ripple";
import stylesheet from "./app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        {/* `viewport-fit=cover` — REQUIRED for `env(safe-area-inset-*)` to
             resolve to anything but 0. The mobile header, footer nav, player
             shell, sheet footers and toasts all pad with those insets; without
             this they were silently no-ops on notched phones.
             `interactive-widget=resizes-content` makes Chrome/Android shrink
             the layout viewport when the on-screen keyboard opens, so bottom
             sheets stay above it natively. iOS doesn't honour it — see
             `useKeyboardInset`, which covers that case. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <title>Muza</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full overflow-hidden antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  /* One document-level listener drives the press ripple on everything wearing
     `.press-ripple` — components and exported class strings alike. See the
     module for why it is not a per-component handler. */
  usePressRipple();

  return (
    <ThemeProvider>
      <ToastProvider>
        <Outlet />
        <ToastViewport />
      </ToastProvider>
    </ThemeProvider>
  );
}
