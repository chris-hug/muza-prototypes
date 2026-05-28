import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "node:child_process";

// Last commit date on the building checkout, injected at build time so
// the design-system "Last pushed" label auto-derives from git instead
// of being hand-maintained. In CI the deployed build runs from the
// just-pushed commit, so HEAD's commit date IS the push date. Falls
// back to an empty string if git isn't available (the DS page then
// hides the label gracefully).
function lastCommitDate(): string {
  try {
    return execSync("git log -1 --format=%cd --date=format:%Y-%m-%d", {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

export default defineConfig({
  define: {
    __LAST_GIT_PUSH__: JSON.stringify(lastCommitDate()),
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
  ],
server: {
    port: parseInt(process.env.PORT || "5173"),
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
