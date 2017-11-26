/*
import { stripTags, escapeHtml, unescapeHtml } from './string';

const str = '<h1>test</h1><script>alert(1)</script>'

console.log(stripTags(str));
console.log(escapeHtml(str));
console.log(unescapeHtml( escapeHtml(str) ));
*/

/**
 * strip html tags e.g. "<h1>header</h1><p>message</p>" becomes "header message"
 * @param {string} a string
 * @return {string} string with tags stripped
 */
export function stripTags (string: string = ''): string {
    return (string + '').replace(/(<([^>]+)>)/ig, ' ').replace(/\s+/g, ' ');
}

/**
 * escaping user input e.g. html code in a message box
 * @param {string} string - string to escape
 * @return {string}
 */
export function escapeHtml (string: string = ''): string {
	return string ? (string + '').replace(
		/[&<>"']/g,
		(match) => ({
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		}[match])
	) : '';
}

/**
 * unescaping strings escaped by escapeHtml.js
 * @param {string} string - string to unescape
 * @return {string}
 */
export function unescapeHtml (string: string = ''): string {
	return string ? (string + '').replace(
		/&.+?;/g,
		(match) => ({
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&quot;': '"',
			'&#039;': "'"
		}[match] || match)
	) : '';
}
