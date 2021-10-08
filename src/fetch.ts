import { abortRequest, progressCounter } from './stores';
import { makeApiUrl } from './util';

export async function fetchWrapper(path, params = {}, suppressErrors = false) {
    const abortController = abortRequest();
    const apiUrl = makeApiUrl(path);
    const url = new URL(apiUrl);
    let response;

    // Remove parameters with undefined value
    if (Object.getOwnPropertyNames(params).length) {
        const filteredParams = {};
        Object.getOwnPropertyNames(params).forEach(name => {
            const value = params[name];
            if (typeof value !== 'undefined') {
                filteredParams[name] = value;
            }
        });
        if (Object.getOwnPropertyNames(filteredParams).length) {
            url.search = new URLSearchParams(filteredParams).toString();
        }
    }

    progressCounter.increment();

    try {
        response = await fetch(url.toString(), { signal: abortController.signal });
    } catch (error) {
        if (error.name === 'AbortError') {
            return null;
        }
        // Unexpected/unhandled error (e.g., can't connect to API)
        return {
            error: {
                code: response.status,
                title: 'Error',
                explanation: 'Unable to search at this time',
                detail: process.env.DEBUG ? error.message : undefined
            }
        };
    } finally {
        progressCounter.decrement();
    }

    if ((response.status >= 400 && !suppressErrors) || response.status >= 500) {
        const defaultError = {
            code: response.status,
            title: response.statusText,
            explanation: 'Something unexpected happened',
            detail: undefined
        };
        try {
            const data = await response.json();
            const error = {...defaultError, ...data.error};
            return { error };
        } catch (error) {
            return { error: defaultError };
        }
    }

    try {
        const data = await response.json();
        // XXX: Special case for 30X errors
        if (data.error) {
            data.error.code = response.status;
        }
        return data;
    } catch (error) {
        return {
            error: {
                code: response.status,
                title: 'Bad data received',
                explanation: 'Fetched data is not valid JSON',
                detail: error.toString()
            }
        };
    }
}
