import { defineConfig } from "vite"
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    root: "src",
    publicDir: "../public",
    envDir: "../",
    build: {
        emptyOutDir: true,
        outDir: "../dist",

        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
            },
        }
    }

})