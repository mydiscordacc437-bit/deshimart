import fs from 'fs'
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function spaAdminAndFallbackPlugin() {
  return {
    name: 'spa-admin-and-fallback',
    closeBundle() {
      try {
        const distDir = path.resolve(process.cwd(), 'dist')
        const indexHtml = path.join(distDir, 'index.html')
        if (!fs.existsSync(indexHtml)) return

        // Create dist/404.html for static hosts
        fs.copyFileSync(indexHtml, path.join(distDir, '404.html'))

        // Create dist/admin.html and dist/admin/index.html so /admin never 404s on any host
        fs.copyFileSync(indexHtml, path.join(distDir, 'admin.html'))
        const adminDir = path.join(distDir, 'admin')
        if (!fs.existsSync(adminDir)) {
          fs.mkdirSync(adminDir, { recursive: true })
        }
        fs.copyFileSync(indexHtml, path.join(adminDir, 'index.html'))
      } catch (err) {
        console.warn('SPA fallback generation warning:', err)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaAdminAndFallbackPlugin()],
})
