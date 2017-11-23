
/**
 * strip html tags e.g. "<h1>header</h1><p>message</p>" becomes "header message"
 * @param {string} a string
 * @return {string} string with tags stripped
 */
export function stripTags (string = ''): string {
    return string.replace(/(<([^>]+)>)/ig, ' ');
}
