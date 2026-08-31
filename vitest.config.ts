import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    server: {
      deps: {
        // The official DSH primitive bundle ships CSS modules alongside ESM.
        // Let Vite transform it instead of handing those imports to raw Node.
        inline: [/@deepseek-ai\/dsh-client-ui-primitives/],
      },
    },
  },
})
