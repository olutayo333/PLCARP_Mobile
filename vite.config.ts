import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__DEV__': JSON.stringify(mode === 'development'),
    },
    resolve: {
      alias: [
        { find: /^react-native$/, replacement: path.resolve(__dirname, 'src/react-native-mock.ts') },
        { find: /^react-native\/(.*)$/, replacement: path.resolve(__dirname, 'src/react-native-mock.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
        { find: 'react-native-svg', replacement: 'react-native-svg-web' },
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
