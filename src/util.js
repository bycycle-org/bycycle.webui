import { abortRequest, progressCounter } from './stores';

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

export async function fetchWrapper(path, params = {}, suppressErrors = false) {
    const abortController = abortRequest();
    const apiUrl = makeApiUrl(path);
    const url = new URL(apiUrl);
    let response;

    if (Object.getOwnPropertyNames(params).length) {
        url.search = new URLSearchParams(params);
    }

    progressCounter.increment();

    try {
        response = await fetch(url, { signal: abortController.signal });
    } catch (error) {
        if (error.name === 'AbortError') {
            return null;
        }
        return {
            error: {
                title: 'Error',
                explanation: 'Unable to search at this time',
                detail: process.env.DEBUG ? error.message : null
            }
        };
    } finally {
        progressCounter.decrement();
    }

    if ((response.status >= 400 && !suppressErrors) || response.status >= 500) {
        const defaultError = {
            title: response.statusText,
            explanation: 'Something unexpected happened'
        };
        try {
            const data = await response.json();
            return { error: data.error || defaultError };
        } catch (error) {
            return { error: defaultError };
        }
    }

    try {
        return await response.json();
    } catch (error) {
        return {
            error: {
                title: 'Bad data received',
                explanation: 'Fetched data is not valid JSON',
                detail: error.toString()
            }
        };
    }
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
