/**
 * strip html tags e.g. "<h1>header</h1><p>message</p>" becomes "header message"
 * @param {string} a string
 * @return {string} string with tags stripped
 */
export function stripTags (value: string = ''): string {
    return (value + '').replace(/(<([^>]+)>)/ig, ' ').replace(/\s+/g, ' ');
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
 * unescaping strings escaped by escapeHtml.js
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
