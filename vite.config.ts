
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 確保在 GitHub Pages 的子路徑下也能正確載入
  build: {
    outDir: 'dist',
  }
});
