/***
description: string utility functions
version: 2.0.4
keywords:
    - stripTags
    - escapeHtml
    - unescapeHtml
    - prepad0
example: |
    import { stripTags, escapeHtml, unescapeHtml, prepad0 } from '@coolgk/string';
    // OR
    // const { stripTags, escapeHtml, unescapeHtml, prepad0 } = require('@coolgk/string');

    const str = '<h1>test</h1><script>alert(1)</script>'

    console.log(stripTags(str)); //  test alert(1)
    console.log(escapeHtml(str)); // &lt;h1&gt;test&lt;/h1&gt;&lt;script&gt;alert(1)&lt;/script&gt;
    console.log(unescapeHtml(escapeHtml(str))); // <h1>test</h1><script>alert(1)</script>

    console.log(prepad0(7, 2)); // 07
    console.log(prepad0(70, 3)); // 070
    console.log(prepad0(70, 4)); // 0070
    console.log(prepad0(1, 4)); // 0001
    console.log(prepad0(1000, 2)); // 1000
*/

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

/**
 * strip html tags e.g. "&lt;h1&gt;header&lt;/h1&gt;&lt;p&gt;message&lt;/p&gt;" becomes "header message"
 * @param {string} a string
 * @return {string} - string with tags stripped
 */
export function stripTags (value: string = ''): string {
    return (value + '').replace(/(<([^>]+)>)/ig, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * escaping user input e.g. html code in a message box
 * @param {string} value - string to escape
 * @return {string}
 */
export function escapeHtml (value: string = ''): string {
    const mappings: {[index: string]: string} = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return value ? (value + '').replace(/[&<>"']/g, (matches: string) => (mappings[matches])) : '';
}

/**
 * unescaping strings escaped by escapeHtml()
 * @param {string} string - string to unescape
 * @return {string}
 */
export function unescapeHtml (value: string = ''): string {
    const mappings: {[index: string]: string} = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'"
    };
    return value ? (value + '').replace(/&.+?;/g, (matches: string) => (mappings[matches] || matches)) : '';
}

/**
 * use padStart instead
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
 * @param {number} value - an integer in string or number format
 * @param {number} length - length of the output e.g. length = 2, 8 becomes 08. length = 3, 70 = 070.
 * @return {string}
 */
export function prepad0 (value: number | string, length: number = 2): string {
    return (value + '').length > length ? value + '' : ('0'.repeat(length) + value).substr(-length);
    // return (value + '').padStart(length, '0'); // this is ES7 only?
}
