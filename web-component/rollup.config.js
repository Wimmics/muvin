// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-import-css';
import url from '@rollup/plugin-url';
import json from '@rollup/plugin-json';


export default {
  input: 'src/muvin.js',
  output: {
    file: 'dist/vis-muvin.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    css(), // ⬅ this lets you import CSS as string
    resolve(),
    commonjs(),
    url({
      include: ['**/*.png', '**/*.jpg', '**/*.svg'],
      limit: 0, // 0 = always copy files instead of inlining as base64
      fileName: '[name][hash][extname]',
      destDir: 'dist/assets' // where the images will go
    }),
    json()
  ]
};
