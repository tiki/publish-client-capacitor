// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  assetsInclude: ['**/*.md'],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'my-lib',
      fileName: 'my-lib',
    },
  },
  plugins: [dts()],
})