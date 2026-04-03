import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // SSE를 위한 설정
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Authorization 헤더가 있으면 그대로 전달
            if (req.headers['authorization']) {
              proxyReq.setHeader('Authorization', req.headers['authorization'])
            }
          })
        }
      }
    }
  }
})