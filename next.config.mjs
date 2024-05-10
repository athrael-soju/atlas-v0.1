/**
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function defineNextConfig(config) {
  return config
}

const getCorsHeaders = () => {
  const headers = {}

  headers['Access-Control-Allow-Origin'] = '*'
  headers['Access-Control-Allow-Credentials'] = 'true'
  headers['Access-Control-Allow-Methods'] = 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  headers['Access-Control-Allow-Headers'] =
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'

  return Object.entries(headers).map(([key, value]) => ({ key, value }))
}

export default defineNextConfig({
  reactStrictMode: true,
  swcMinify: true,
  publicRuntimeConfig: {},
  headers: async () => {
    return [
      {
        source: '/api/(.*)',
        headers: getCorsHeaders()
      }
    ]
  }
})
