import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 8077,
    open: false,
    allowedHosts: true,
  },
})
