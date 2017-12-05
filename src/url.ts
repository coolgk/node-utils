/*

import { getParams } from './url';

const url = '/123';
const pattern = '/:id';

console.log(getParams(url, pattern));

const url2 = '/123/abc/456';
const pattern2 = '/:id/abc/:value';

console.log(getParams(url2, pattern2));

const url3 = '/123/456';
const pattern3 = ':id/:value';

console.log(getParams(url3, pattern3));

*/
/**
 * a simple function to get params in a url e.g. with url: user/123, pattern: user/:id returns {id: 123}
 * @param {string} url - url after the domain name e.g. http://abc.com/user/:id url should be /user/:id
 * @param {string} pattern - e.g. /:userid/:name
 * @return {object} - e.g. {userid: 123}
 */
export function getParams (url: string, pattern: string): {} {
    const params: {[key: string]: string, [key: number]: string} = {};

    if (pattern[0] !== '/') {
        pattern = '/' + pattern;
    }

    (pattern.match(/:\w+/g) || []).forEach((name, index) => {
        // remove : from match name e.g. :id
        name = name.substr(1);
        params[name] = '';

        // allow accessing params by index e.g. /user/:userId/section/:sectionId
        // params[1] = params[userId], params[2] = params[sectionId]
        // this is needed for updating param values from matching url
        Object.defineProperty(params, index + 1, {
            set: (value) => {
                params[name] = value;
            }
        });
    });

    const match = (new RegExp(pattern.replace(/\/:\w+/g, '/?([^\/#\?]*)'), 'gi')).exec(url);

    if (match) {
        match.forEach((value, index) => {
            if (index) { // [0] is the full string matched
                params[index] = decodeURIComponent(value);
            }
        });
    }

    return params;
}
