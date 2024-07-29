import fs from 'node:fs/promises';
import path from 'node:path';
/**
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function defineNextConfig(config) {
  return config;
}

const getCorsHeaders = () => {
  const headers = {};

  headers['Access-Control-Allow-Origin'] = '*';
  headers['Access-Control-Allow-Credentials'] = 'true';
  headers['Access-Control-Allow-Methods'] = 'GET,OPTIONS,PATCH,DELETE,POST,PUT';
  headers['Access-Control-Allow-Headers'] =
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization';

  return Object.entries(headers).map(([key, value]) => ({ key, value }));
};

export default defineNextConfig({
  experimental: {
    serverComponentsExternalPackages: [
      'pdf-parse',
      // 'sharp', // Used for transformer.js
      // 'onnxruntime-node', // Used for transformer.js
      // 'webworker-threads', //used for Natural
    ],
  },
  webpack: (config) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false, // Used for transformer.js
      'mongodb-client-encryption': false, // Unused for Natural
      aws4: false, // Unused for Natural
      'webworker-threads': false, // Unused for Natural
    };
    return config;
  },
  reactStrictMode: true,
  swcMinify: true,
  publicRuntimeConfig: {},
  headers: async () => {
    return [
      {
        source: '/api/(.*)',
        headers: getCorsHeaders(),
      },
    ];
  },
  rewrites: async () => {
    return [
      // FastAPI routes
      {
        source: '/api/hyperion/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/api/hyperion/:path*'
            : '/api/hyperion/:path*',
      },
      {
        source: '/docs',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/docs'
            : '/api/hyperion/docs',
      },
      {
        source: '/openapi.json',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/openapi.json'
            : '/api/hyperion/openapi.json',
      },
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
});

async function copyFiles() {
  try {
    await fs.access('public/');
  } catch {
    await fs.mkdir('public/', { recursive: true });
  }

  const wasmFiles = (
    await fs.readdir('node_modules/onnxruntime-web/dist/')
  ).filter((file) => path.extname(file) === '.wasm');

  await Promise.all([
    fs.copyFile(
      'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
      'public/vad.worklet.bundle.min.js'
    ),
    fs.copyFile(
      'node_modules/@ricky0123/vad-web/dist/silero_vad.onnx',
      'public/silero_vad.onnx'
    ),
    ...wasmFiles.map((file) =>
      fs.copyFile(`node_modules/onnxruntime-web/dist/${file}`, `public/${file}`)
    ),
  ]);
}

copyFiles();
