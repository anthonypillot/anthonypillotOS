import { fileURLToPath, URL } from "node:url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  /* Its define the global scss variables for all components
   * to avoid import in each component
   */
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @import "@/assets/_variables.scss";
        `
      }
    }
  }
})
