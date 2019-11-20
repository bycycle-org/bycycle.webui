import commonjsPlugin from 'rollup-plugin-commonjs';
import dotenvPlugin from 'rollup-plugin-dotenv';
import livereloadPlugin from 'rollup-plugin-livereload';
import resolvePlugin from 'rollup-plugin-node-resolve';
import sveltePlugin from 'rollup-plugin-svelte';
import { terser as terserPlugin } from 'rollup-plugin-terser';

import { render as renderSass } from 'sass';

import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const ENV = process.env.NODE_ENV;
const IS_DEV = ENV === 'development';

const LIVE_RELOAD = !process.env.LIVE_RELOAD
    ? IS_DEV
    : ['true', '1'].includes(process.env.LIVE_RELOAD);

export default {
    input: 'src/main.js',

    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: 'public/bundle.js'
    },

    plugins: [
        dotenvPlugin(),

        sveltePlugin({
            dev: IS_DEV,

            preprocess: {
                style: ({ content, attributes }) => {
                    if (attributes.type !== 'text/scss') {
                        return;
                    }

                    return new Promise((fulfill, reject) => {
                        renderSass(
                            {
                                data: content,
                                includePaths: ['node_modules', 'src'],
                                sourceMap: true,
                                outFile: 'unused'
                            },
                            (error, result) => {
                                if (error) {
                                    return reject(error);
                                }

                                postcss(autoprefixer)
                                    .process(result.css.toString(), { from: undefined })
                                    .then(postcssResult => {
                                        fulfill({
                                            code: postcssResult.css,
                                            map: result.map.toString()
                                        });
                                    });
                            }
                        );
                    });
                }
            },

            css: css => {
                css.write('public/bundle.css');
            }
        }),

        resolvePlugin(),
        commonjsPlugin(),

        LIVE_RELOAD && livereloadPlugin('public'),

        !IS_DEV && terserPlugin()
    ]
};
