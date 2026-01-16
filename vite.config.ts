import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 如果是 GitHub Pages 部署，使用環境變量設置 base 路徑
// 如果是自訂域名，base 設為 '/'；如果是 gh-pages，base 為 '/倉庫名稱/'
const base = process.env.GITHUB_PAGES 
  ? `/${process.env.REPO_NAME || '抽籤系統'}/`
  : '/';

export default defineConfig({
  base,
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
