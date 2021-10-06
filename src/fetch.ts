import { abortRequest, progressCounter } from './stores';
import { makeApiUrl } from './util';

export async function fetchWrapper(path, params = {}, suppressErrors = false) {
    const abortController = abortRequest();
    const apiUrl = makeApiUrl(path);
    const url = new URL(apiUrl);
    let response;

    if (Object.getOwnPropertyNames(params).length) {
        url.search = new URLSearchParams(params).toString();
    }

    progressCounter.increment();

    try {
        response = await fetch(url.toString(), { signal: abortController.signal });
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
