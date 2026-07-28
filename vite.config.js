import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "build",
    assetsDir: "assets",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "ag-grid",
              test: /node_modules\/ag-grid-/
            },
            {
              name: "ionic",
              test: /node_modules\/(?:@ionic|ionicons|@stencil)\//
            },
            {
              name: "react",
              test: /node_modules\/(?:react|react-dom|scheduler)\//
            }
          ]
        }
      }
    }
  }
});
