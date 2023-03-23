import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: '',
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022'
    }
  },
  plugins: [
    basicSsl(),
    svelte()
  ]
})
