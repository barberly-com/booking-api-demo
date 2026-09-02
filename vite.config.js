import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Nothing special: the examples are a static site that talks to the Booking API
// directly from the browser. The key lives in src/config.js — see the README for
// how to keep your own key off the client in production.
export default defineConfig({
  plugins: [react()],
});
