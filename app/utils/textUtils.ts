/**
 * Converts a string to Sentence case.
 * Example: "hello world. this is a test." -> "Hello world. This is a test."
 */
export function toSentenceCase(text: string): string {
    return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, function(match) {
            return match.toUpperCase();
        });
}