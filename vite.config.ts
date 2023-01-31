import { resolve } from "path";
import { defineConfig } from "vite";
import { execSync } from "child_process";
import react from "@vitejs/plugin-react";

const commitHash = execSync("git rev-parse --short HEAD").toString().trim();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  plugins: [react()],
  build: {
    target: ["edge90", "chrome90", "firefox90", "safari15"],
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        iframe: resolve(__dirname, "iframe.html"),
      },
    },
  },
});
