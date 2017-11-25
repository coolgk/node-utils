
/**
 * strip html tags e.g. "<h1>header</h1><p>message</p>" becomes "header message"
 * @param {string} a string
 * @return {string} string with tags stripped
 */
export function stripTags (string = ''): string {
    return string.replace(/(<([^>]+)>)/ig, ' ');
}

/**
 * escaping user input e.g. html code in a message box
 * @param {string} string - string to escape
 * @return {string} 
 */
export function escapeHtml (string: string): string {
	return string ? string.replace(
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
