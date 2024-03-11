import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir:"/ssh/",
  base:"/ssh/",
  server: {
    proxy: {
      '/template_data/data': {
        target: 'http://127.0.0.1:8009', //目标url
        changeOrigin: true, //支持跨域
      },
      '/template_data/ws': {
        target: 'ws://127.0.0.1:8009', //目标url
        changeOrigin: true, //支持跨域
        ws:true,

      }
    }
  }
});
