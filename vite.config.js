import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// One page per example, plus a plain-HTML index that links to them. Each demo gets
// its own URL (/hub/, /wizard/) and its own bundle, so an example can be read, copied
// or deleted on its own — and adding a third means adding one folder and one entry.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        hub: resolve(__dirname, "hub/index.html"),
        wizard: resolve(__dirname, "wizard/index.html"),
      },
    },
  },
});
