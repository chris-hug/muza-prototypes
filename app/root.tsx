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
        {/* Figma capture — script + a floating dev-only "Capture" button
            that triggers the element picker. Remove both when done. */}
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function mountBtn() {
                  if (document.getElementById("__figma_capture_btn")) return;
                  var b = document.createElement("button");
                  b.id = "__figma_capture_btn";
                  b.textContent = "📸 Capture to Figma";
                  b.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483647;padding:10px 14px;border-radius:9999px;border:1px solid rgba(0,0,0,.1);background:#0D0D04;color:#FAFCF4;font:600 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);";
                  b.onclick = function () {
                    if (!window.figma || !window.figma.captureForDesign) {
                      alert("Capture script not ready yet — try again in a second.");
                      return;
                    }
                    window.figma.captureForDesign({ selector: "*" });
                  };
                  document.body.appendChild(b);
                }
                if (document.readyState === "complete" || document.readyState === "interactive") mountBtn();
                else document.addEventListener("DOMContentLoaded", mountBtn);
                // Re-mount if React rewrites the body on hydration.
                setInterval(mountBtn, 1000);
              })();
            `,
          }}
        />
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
