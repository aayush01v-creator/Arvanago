import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0"
    },
    plugins: [react()],
    define: {
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY),
      "import.meta.env.VITE_IMGBB_KEY": JSON.stringify(env.VITE_IMGBB_KEY)
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./", import.meta.url))
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }

            if (id.includes("firebase")) {
              return "firebase";
            }

            if (id.includes("react")) {
              return "react-vendor";
            }

            return "vendor";
          }
        }
      },
      chunkSizeWarningLimit: 1500
    }
  };
});
