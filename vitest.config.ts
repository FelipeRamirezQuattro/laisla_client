import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/utils/**/*.ts',
        'src/store/authStore.ts',
        'src/components/ProtectedRoute.tsx',
        'src/components/RoleGuard.tsx',
        'src/components/caja/DenominationCounter.tsx'
      ],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**']
    }
  }
});
