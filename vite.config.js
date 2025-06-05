// vite.config.js
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        killers: resolve(__dirname, 'pages/killers.html'),
        killmail: resolve(__dirname, 'pages/killmail.html'),
        search: resolve(__dirname, 'pages/search.html'),
        systems: resolve(__dirname, 'pages/systems.html'),
        victims: resolve(__dirname, 'pages/victims.html'),
      },
    },
  },
  // Optional: If your assets (like favicon.png or images in CSS) are in a specific directory
  publicDir: 'public', // if you create a 'public' folder for static assets
});
