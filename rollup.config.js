import commonjsPlugin from '@rollup/plugin-commonjs';
import cssPlugin from 'rollup-plugin-css-only';
import dotenvPlugin from 'rollup-plugin-dotenv';
import livereloadPlugin from 'rollup-plugin-livereload';
import resolvePlugin from '@rollup/plugin-node-resolve';
import sveltePlugin from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import typescriptPlugin from '@rollup/plugin-typescript';
import { terser as terserPlugin } from 'rollup-plugin-terser';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const ENV = process.env.NODE_ENV;
const IS_DEV = ENV === 'development';

const LIVE_RELOAD = !process.env.LIVE_RELOAD
    ? IS_DEV
    : ['true', '1'].includes(process.env.LIVE_RELOAD);

export default {
    input: 'src/main.ts',

    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: 'public/build/bundle.js'
    },

    watch: {
        clearScreen: false
    },

    plugins: [
        dotenvPlugin(),

        sveltePlugin({
            preprocess: sveltePreprocess({
                sourceMap: IS_DEV
            }),

            compilerOptions: {
                dev: IS_DEV
            }
        }),

        cssPlugin({ output: 'bundle.css' }),

        resolvePlugin({
            browser: true,
            dedupe: ['svelte']
        }),

        commonjsPlugin(),

        typescriptPlugin({
            sourceMap: IS_DEV,
            inlineSources: IS_DEV
        }),

        LIVE_RELOAD && livereloadPlugin('public'),

        !IS_DEV && terserPlugin()
    ]
};
