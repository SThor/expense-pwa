/* eslint-disable import/no-nodejs-modules */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Custom plugin to handle YNAB browser build
const ynabPlugin = () => ({
  name: "ynab-plugin",
  configureServer(server) {
    // Serve YNAB file during development
    server.middlewares.use("/ynab.js", (req, res, next) => {
      try {
        const ynabPath = resolve("node_modules/ynab/dist/browser/ynab.js");
        const content = readFileSync(ynabPath, "utf-8");
        res.setHeader("Content-Type", "application/javascript");
        res.end(content);
      } catch (error) {
        next(error);
      }
    });
  },
  generateBundle(options, bundle) {
    // Copy YNAB file directly to dist during build
    try {
      const ynabPath = resolve("node_modules/ynab/dist/browser/ynab.js");
      const content = readFileSync(ynabPath, "utf-8");

      // Add the file to the bundle
      this.emitFile({
        type: "asset",
        fileName: "ynab.js",
        source: content,
      });
    } catch (error) {
      this.error("Failed to copy YNAB browser build: " + error.message);
    }
  },
});

export default defineConfig({
  plugins: [
    ynabPlugin(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        runtimeCaching: [
          // Never cache YNAB API - always fresh financial data
          {
            urlPattern: /^https:\/\/api\.ynab\.com\/.*/,
            handler: "NetworkOnly",
          },
          // Never cache SettleUp API - always fresh financial data
          {
            urlPattern: /^https:\/\/settle-up-.*\.firebaseio\.com\/.*/,
            handler: "NetworkOnly",
          },
          // Never cache Firebase APIs - always fresh auth/data
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/,
            handler: "NetworkOnly",
          },
          // Cache other resources with stale-while-revalidate
          {
            urlPattern: /^https:\/\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "external-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
            },
          },
        ],
      },
      manifest: {
        name: "€xpense - Quick Expense Entry",
        short_name: "€xpense",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#3b82f6",
        lang: "en",
        dir: "ltr",
        description:
          "Quick and easy expense entry with automatic categorization",
        categories: ["finance", "productivity", "utilities"],
        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/favicon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
        shortcuts: [
          {
            name: "Add Expense",
            short_name: "Add",
            description: "Quickly add a new expense",
            url: "/",
            icons: [
              {
                src: "/web-app-manifest-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
            ],
          },
        ],
      },
    }),
  ],
});
