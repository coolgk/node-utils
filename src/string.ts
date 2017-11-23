
// strip html tags e.g. "<h1>header</h1><p>message</p>" becomes "header message"
export function stripTags (string = ''): string {
    return string.replace(/(<([^>]+)>)/ig, ' ');
}
