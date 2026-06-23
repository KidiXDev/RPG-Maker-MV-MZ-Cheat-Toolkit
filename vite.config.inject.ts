import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    emptyOutDir: true,
    target: 'chrome41',
    cssTarget: 'chrome41',
    cssCodeSplit: false,
    lib: {
      entry: 'src/inject/main.tsx',
      formats: ['iife'],
      name: 'RmcCheatToolkit',
      fileName: () => 'cheat.js'
    },
    rollupOptions: {
      output: {
        banner:
          "if (typeof globalThis === 'undefined') { var globalThis = typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this; }\nif (typeof globalThis.queueMicrotask !== 'function') { globalThis.queueMicrotask = function (cb) { Promise.resolve().then(cb).catch(function (err) { setTimeout(function () { throw err; }, 0); }); }; }\nif (!String.prototype.trimStart) { String.prototype.trimStart = String.prototype.trimLeft || function () { return this.replace(/^\\s+/, ''); }; }\nif (!String.prototype.trimEnd) { String.prototype.trimEnd = String.prototype.trimRight || function () { return this.replace(/\\s+$/, ''); }; }\nif (!Object.fromEntries) { Object.fromEntries = function (entries) { var object = {}; var i; var entry; if (entries && typeof entries.length === 'number') { for (i = 0; i < entries.length; i += 1) { object[entries[i][0]] = entries[i][1]; } return object; } for (entry of entries) { object[entry[0]] = entry[1]; } return object; }; }",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith('.css') ? 'cheat.css' : 'assets/[name][extname]'
      }
    }
  }
});
