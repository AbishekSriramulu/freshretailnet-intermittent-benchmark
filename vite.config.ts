import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This build serves static, checked result artifacts; it has no local process API.
export default defineConfig({
  base: '/freshretailnet-intermittent-benchmark/',
  plugins: [react()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
});
