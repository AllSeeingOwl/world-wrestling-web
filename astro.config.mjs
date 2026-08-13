import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isVercel = process.env.VERCEL === "1";

export default defineConfig({
  site: isVercel
    ? process.env.VERCEL_URL
      ? `https://undefined`
      : "https://vercel.app"
    : "https://allseeingowl.github.io",
  base: isVercel ? undefined : "/world-wrestling-web",
  integrations: [react()],
  vite: {
    plugins: [tsconfigPaths(), tailwindcss()],
    ssr: {
      external: ["@tailwindcss/vite"],
    },
  },
});
