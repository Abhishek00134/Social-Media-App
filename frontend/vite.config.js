import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'https://social-media-app-klec.onrender.com',
                changeOrigin: true,
                secure: false
            },
            '/socket.io': {
                target: 'https://social-media-app-klec.onrender.com',
                ws: true,
                changeOrigin: true,
                secure: false
            }
        }
    }
});
