import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  // -----------------------------
  // ✅ LOAD ENV VARIABLES HERE
  // -----------------------------
  const env = loadEnv(mode, process.cwd(), "");
  let COMMON_BASE = env.VITE_COMMON_BASE_URL || "common/";

  // Make sure it always ends with a slash
  if (!COMMON_BASE.endsWith("/")) {
    COMMON_BASE += "/";
  }

  console.log("COMMON BASE:", COMMON_BASE);

  return {
    base: "./", 
    // DO NOT auto-copy public
    publicDir: false,

    plugins: [
      react(),

      svgr(),

      // Copy all public assets manually
      viteStaticCopy({
        targets: [
          { src: "public/data/*", dest: "data", rename: { stripBase: 2 } },
          { src: "public/images/**/*", dest: "images", rename: { stripBase: 2 } },
          { src: "public/audio/**/*", dest: "audio", rename: { stripBase: 2 } },
          { src: "public/videos/**/*", dest: "videos", rename: { stripBase: 2 }}
        ],
      }),

      {
        name: "inject-scripts-and-move-index",
        closeBundle() {
          const rootHtml = "dist/index.html";
          const targetDir = "dist";
          const targetHtml = "dist/index.html";
          
          // Define your base for common assets (assuming it's what COMMON_BASE represents)
          const BASE_PATH = COMMON_BASE || "/";

          if (!fs.existsSync(rootHtml)) {
            console.error("ERROR: Could not find index.html at root build directory:", rootHtml);
            return;
          }

          // 1. Read the compiled HTML file from the root output
          let html = fs.readFileSync(rootHtml, "utf8");

          // 2. Clean up any leftover dev server scripts if they exist
          html = html.replace(/<script[^>]+main\.jsx[^>]*><\/script>/g, "");
          html = html.replace(/<script[^>]+bundle\.js[^>]*><\/script>/g, "");
          html = html.replace(/<script[^>]+createjsmin\.js[^>]*><\/script>/g, "");
          html = html.replace(/<link[^>]+index\.css[^>]*>/g, "");

          // 3. Define your custom runtime libraries to inject
          const scriptsToInject = `
            <script src="${BASE_PATH}libs/createjsmin.js"></script>
            <script type="module" src="${BASE_PATH}js/bundle.js"></script>
          `;

          // 4. Define your custom styles to inject
          const linksToInject = `
            <link rel="stylesheet" crossorigin href="${BASE_PATH}css/index.css">
          `;

          // 5. Inject the custom link tag right before the closing </head> tag
          html = html.replace("</head>", `${linksToInject}</head>`);

          // 6. Inject the custom script tag right before the closing </body> tag
          html = html.replace("</body>", `${scriptsToInject}</body>`);

          // 7. Ensure the dist/app target folder exists
          // if (!fs.existsSync(targetDir)) {
          //   fs.mkdirSync(targetDir, { recursive: true });
          // }

          // 8. Save the modified code directly into its final home under dist/app/
          // fs.writeFileSync(targetHtml, html, "utf8");
          // console.log("SUCCESS: Injected createjsmin and saved index.html to dist/app/");

          // 9. Clean up the original root HTML file so only ONE remains
          // if (fs.existsSync(rootHtml)) {
          //   fs.unlinkSync(rootHtml);
          // }
        }
      }
    ],

    build: {
      outDir: "dist",
      emptyOutDir: true,
      assetsInlineLimit: 0,

      rollupOptions: {
        // ENTRY is ONLY jsx, NOT html
        // input: "src/main.jsx",
        input: path.resolve(__dirname, "index.html"),

        output: {
          entryFileNames: `${COMMON_BASE}js/bundle.js`,
          chunkFileNames: `${COMMON_BASE}js/[name].js`,
          // assetFileNames: "common/assets-ignore/[name][extname]", // ignore Vite CSS/PNG/font extraction
          assetFileNames: (assetInfo) => {
            const ext = path.extname(assetInfo.name).slice(1).toLowerCase();

            if (/^(mp3|wav|ogg|flac|aac|m4a|opus)$/.test(ext)) {
              return `${COMMON_BASE}audio/[name][extname]`;
            }

            if (/^(mp4|webm|ogg|mov|m4v)$/.test(ext)) {
              return `${COMMON_BASE}videos/[name][extname]`;
            }

            if (/^(png|jpe?g|gif|svg|webp|avif|bmp|tiff)$/.test(ext)) {
              return `${COMMON_BASE}images/[name][extname]`;
            }

            if (/^(woff2?|ttf|eot|otf)$/.test(ext)) {
              return `${COMMON_BASE}fonts/[name][extname]`;
            }

            if (/^(css)$/.test(ext)) {
              return `${COMMON_BASE}css/[name][extname]`;
            }

            if (/^(json)$/.test(ext)) {
              return `${COMMON_BASE}json/[name][extname]`;
            }

            return `${COMMON_BASE}[name][extname]`;
          },
        },
      },
    },
    // DEV SERVER (open public/index.html manually)
    server: {
      open: "/public/index.html",
    },
  };
});