import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";
import nodePath from "path";

// Plugin to sync bbq/index.html asset paths after build
function syncBbqAssetsPlugin() {
  return {
    name: "sync-bbq-assets",
    closeBundle() {
      try {
        const distIndex = nodePath.resolve(__dirname, "dist/index.html");
        const bbqIndex = nodePath.resolve(__dirname, "dist/bbq/index.html");
        if (!fs.existsSync(distIndex) || !fs.existsSync(bbqIndex)) return;

        const main = fs.readFileSync(distIndex, "utf-8");
        const jsMatch = main.match(/src="(\/assets\/index-[^"]+\.js)"/);
        const cssMatch = main.match(/href="(\/assets\/index-[^"]+\.css)"/);
        if (!jsMatch || !cssMatch) return;

        let bbq = fs.readFileSync(bbqIndex, "utf-8");
        bbq = bbq.replace(/src="\/assets\/index-[^"]+\.js"/, `src="${jsMatch[1]}"`);
        bbq = bbq.replace(/href="\/assets\/index-[^"]+\.css"/, `href="${cssMatch[1]}"`);
        fs.writeFileSync(bbqIndex, bbq, "utf-8");
        console.log("sync-bbq-assets: updated dist/bbq/index.html");
      } catch (e) {
        // Non-fatal
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api-bbq.ashx': {
        target: 'https://ophir.travelsure.co.il',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '->', proxyReq.path);
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), syncBbqAssetsPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
