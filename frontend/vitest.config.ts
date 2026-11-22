import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      restoreMocks: true,
      // Fluxos de tela completos (digitação, telas sob demanda) com muitos arquivos em paralelo.
      testTimeout: 20000,
    },
  }),
)
