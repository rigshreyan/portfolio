import { defineConfig } from "astro/config";
import Tailwind from "@astrojs/tailwind";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [Tailwind(), icon()],
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['photoswipe']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['photoswipe']
    }
  },
  compressHTML: true
});
