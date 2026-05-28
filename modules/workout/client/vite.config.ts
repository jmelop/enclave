import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: [
      { find: '@enclave/sdk',      replacement: path.resolve(__dirname, '../../../packages/sdk/src/index.ts') },
      { find: '@enclave/ui-shell', replacement: path.resolve(__dirname, '../../../packages/ui-shell/src/index.ts') },
      { find: /^react$/,           replacement: path.resolve(__dirname, '../node_modules/react') },
      { find: /^react-dom$/,       replacement: path.resolve(__dirname, '../node_modules/react-dom') },
      { find: /^react-router-dom$/,replacement: path.resolve(__dirname, '../node_modules/react-router-dom') },
      { find: /^@venator-ui\/ui$/, replacement: path.resolve(__dirname, '../node_modules/@venator-ui/ui') },
      { find: /^lucide-react$/,    replacement: path.resolve(__dirname, '../node_modules/lucide-react') },
    ],
  },
});
