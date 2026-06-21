import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appPort = Number(env.APP_PORT) || 5173;
  const apiUrl = env.API_URL || 'http://localhost';
  const apiPort = Number(env.API_PORT) || 3000;

  return {
    plugins: [react()],
    server: {
      port: appPort,
      proxy: {
        '/api': {
          target: `${apiUrl}:${apiPort}`,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: `${apiUrl}:${apiPort}`,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
