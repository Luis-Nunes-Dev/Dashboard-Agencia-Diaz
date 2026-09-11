import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Evita um alerta falso do relatório para o bundle necessário do Recharts.
  build: {
    chunkSizeWarningLimit: 700,
  },
})