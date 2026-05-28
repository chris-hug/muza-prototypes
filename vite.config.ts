import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "node:child_process";
import { SECTION_SOURCE } from "./app/routes/ds-sources";

// Last commit date on the building checkout, injected at build time so
// the design-system "Last pushed" label auto-derives from git instead
// of being hand-maintained. In CI the deployed build runs from the
// just-pushed commit, so HEAD's commit date IS the push date. Falls
// back to an empty string if git isn't available (the DS page then
// hides the label gracefully).
function lastCommitDate(file?: string): string {
  try {
    const target = file ? ` -- "${file}"` : "";
    return execSync(
      `git log -1 --format=%cd --date=format:%Y-%m-%d${target}`,
      { encoding: "utf8" },
    ).trim();
  } catch {
    return "";
  }
}

// Per-DS-section "last changed" date: the date of the last commit that
// touched each section's backing file. Auto-updates from git history —
// no hand-maintained per-component dates. Empty/missing files are
// skipped (the section just shows no "changed" date).
function sectionChangeDates(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, file] of Object.entries(SECTION_SOURCE)) {
    const date = lastCommitDate(file);
    if (date) out[id] = date;
  }
  return out;
}

// GitHub "blob" base for deep-linking each component to its source —
// derived from the origin remote + current branch at build time. e.g.
// "https://github.com/chris-hug/muza-prototypes/blob/main". Falls back
// to "" if git/remote is unavailable (links then hidden).
function repoBlobBase(): string {
  try {
    const remote = execSync("git remote get-url origin", { encoding: "utf8" }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
    // Normalise SSH or HTTPS remote → https web URL, strip trailing .git
    const web = remote
      .replace(/^git@github\.com:/, "https://github.com/")
      .replace(/\.git$/, "");
    if (!web.startsWith("http")) return "";
    return `${web}/blob/${branch || "main"}`;
  } catch {
    return "";
  }
}

export default defineConfig({
  define: {
    __LAST_GIT_PUSH__: JSON.stringify(lastCommitDate()),
    __SECTION_LAST_CHANGED__: JSON.stringify(sectionChangeDates()),
    __REPO_BLOB_BASE__: JSON.stringify(repoBlobBase()),
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
