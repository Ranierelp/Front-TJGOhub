const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline.html',
  },
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    {
      urlPattern: /\.(?:json|xml|csv)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-data-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    // TODO: Ajustar cache para APIs críticas e background sync
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration (stable)
  turbopack: {
    resolveAlias: {
      // Alias para imports mais limpos
      '@': './',
      '@/components': './components',
      '@/lib': './lib',
      '@/models': './models',
      '@/types': './types',
      '@/utils': './utils',
      '@/config': './config',
      '@/hooks': './hooks',
      '@/stores': './stores',
      '@/styles': './styles',
    },
  },
  // Outras configurações do Next.js
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  // Desabilitar remoção automática de trailing slash para APIs
  skipTrailingSlashRedirect: true,
  // Rewrites para proxy da API Django
  async rewrites() {
    const djangoApiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';
    return [
      // Rota com trailing slash (preserva a barra)
      {
        source: '/api/:path*/',
        destination: `${djangoApiUrl}/api/:path*/`,
      },
      // Rota sem trailing slash (adiciona a barra para o Django)
      {
        source: '/api/:path*',
        destination: `${djangoApiUrl}/api/:path*/`,
      },
      // Proxy de media files: elimina problema cross-origin.
      // Sem isso: <img src="http://localhost:8000/media/..."> falha porque
      // o browser trata porta 3000 e porta 8000 como origens diferentes.
      // Com isso: <img src="/media/..."> vai para localhost:3000/media/...
      // que o Next.js redireciona para localhost:8000/media/... — mesmo origin.
      {
        source: '/media/:path*',
        destination: `${djangoApiUrl}/media/:path*`,
      },
    ];
  },
  // Configurações de imagem otimizada
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Configurações de headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = withBundleAnalyzer(withPWA(nextConfig))
