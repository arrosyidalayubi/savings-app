import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    // Menaikkan batas peringatan menjadi 1000 kB (1 MB)
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // Memecah library besar menjadi file JavaScript terpisah (Vendor Splitting)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            return 'vendor-core'; // Sisa node_modules lainnya
          }
        }
      }
    }
  },
})