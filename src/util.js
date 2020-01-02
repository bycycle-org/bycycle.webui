import qs from 'qs';
import { LG_WIDTH, MD_WIDTH, SM_WIDTH, XL_WIDTH } from './const';

const API_URL = process.env.API_URL.replace(/\/+$/, '');

export function makeApiUrl(...segments) {
    if (!segments.length) {
        return API_URL;
    }

    let lastSegment = segments.pop();

    segments = [
        API_URL,
        ...segments.map(segment => segment.replace(/^\/+/, '').replace(/\/+$/, '')),
        lastSegment.replace(/^\/+/, '')
    ];

    return segments.join('/');
}

/**
 * Like the builtin Number.toFixed() but will truncate the number to an
 * integer if it's equal to its rounded value.
 *
 * @param value {number}
 * @param fractionDigits {number} Same as for Number.toFixed()
 * @returns {string}
 */
export function toFixed(value, fractionDigits = 1) {
    const fixedValue = value.toFixed(fractionDigits);
    const roundedValue = Math.round(value);
    return fixedValue == roundedValue ? roundedValue.toString() : fixedValue;
}

/**
 * Call a function that switches on the current breakpoint.
 *
 * Determines the current breakpoint (one of xs, sm, md, lg, or xl) then
 * calls the provided function with it.
 *
 *     breakpointSwitch(breakpoint => {
 *         switch(breakpoint) {
 *             case 'xs':
 *                 return <xs value>;
 *             case 'sm':
 *                 return <sm value>;
 *             default:
 *                 return <default value>;
 *         }
 *     });
 *
 * @param fn {Function}
 * @returns {Any}
 */
export function breakpointSwitch(fn) {
    const bodyWidth = document.body.getBoundingClientRect().width;
    let breakpoint;
    if (bodyWidth >= XL_WIDTH) {
        breakpoint = 'xl';
    } else if (bodyWidth >= LG_WIDTH) {
        breakpoint = 'lg';
    } else if (bodyWidth >= MD_WIDTH) {
        breakpoint = 'md';
    } else if (bodyWidth >= SM_WIDTH) {
        breakpoint = 'sm';
    } else {
        breakpoint = 'xs';
    }
    return fn(breakpoint);
}

/**
 * Convert query string to Object.
 *
 * Blank values are converted to null.
 *
 * @param queryString Query string w/o leading ?
 * @returns {Object} Query parameters
 */
export function queryStringToParams(queryString) {
    const params = queryString ? qs.parse(queryString) : {};
    for (const name of Object.keys(params)) {
        const value = params[name];
        if (value === '') {
            params[name] = null;
        }
    }
    return params;
}

/**
 * Convert Object to query string.
 *
 * Params with undefined, null, or blank values are excluded.
 *
 * @param params {Object} Query parameters
 * @returns {string} Query string w/o leading ?
 */
export function paramsToQueryString(params) {
    for (const name of Object.keys(params)) {
        const value = params[name];
        if (typeof value === 'undefined' || value === null || value === '') {
            delete params[name];
        }
    }
    return qs.stringify(params, { format: 'RFC1738' });
}
