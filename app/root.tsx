import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { LinksFunction } from "react-router";
import { ThemeProvider } from "@/components/app/theme-provider";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import stylesheet from "./app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
  return (
    <ThemeProvider>
      <ToastProvider>
        <Outlet />
        <ToastViewport />
      </ToastProvider>
    </ThemeProvider>
  );
}
