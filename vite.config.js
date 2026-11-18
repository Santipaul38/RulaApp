import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// Genera robots.txt y sitemap.xml al compilar, usando VITE_SITE_URL del .env.
function seoFiles(siteUrl) {
  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      const url = (siteUrl || '').replace(/\/+$/, '')
      if (!url) {
        this.warn('VITE_SITE_URL está vacío: no se generan robots.txt ni sitemap.xml')
        return
      }
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          `  <url>\n    <loc>${url}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n` +
          '</urlset>\n',
      })
    },
  }
}

// En `npm run dev` sirve las funciones de /api (en producción las corre Vercel).
// Solo GET y solo handlers estilo Web (`export function GET(request)`).
function devApi() {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const name = req.url.split('?')[0].replace(/^\/+|\/+$/g, '')
        if (req.method !== 'GET' || !/^[a-z0-9-]+$/i.test(name)) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          if (!mod.GET) return next()
          const response = await mod.GET(
            new Request(`http://${req.headers.host}/api${req.url}`),
          )
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          next(err)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), tailwindcss(), devApi(), seoFiles(env.VITE_SITE_URL)],
  }
})
