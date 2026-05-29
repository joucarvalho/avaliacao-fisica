import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Code-splitting: separa libs pesadas em chunks próprios para o navegador
    // poder cachear cada uma independente do app. Quando lançarmos uma nova
    // versão do app, recharts/pdf-lib continuam vindos do cache.
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ["recharts"],
          pdf: ["pdf-lib", "jspdf", "html2canvas-pro"],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    open: true,
  },
});
