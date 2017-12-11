import trim from 'lodash/trim';
import trimStart from 'lodash/trimStart';
import trimEnd from 'lodash/trimEnd';


const API_URL = process.env.REACT_APP_API_URL;


export function makeApiUrl (...segments) {
    if (!segments.length) {
        return API_URL;
    }

    let lastSegment = segments.pop();

    segments = [
        trimEnd(API_URL, '/'),
        ...segments.map(segment => trim(segment, '/')),
        trimStart(lastSegment, '/')
    ];

    return segments.join('/');
}
