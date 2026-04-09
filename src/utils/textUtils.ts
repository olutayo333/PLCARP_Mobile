/**
 * Decodes common HTML entities back to their original characters.
 * React Native <Text> components do not automatically decode these.
 */
export const decodeHtmlEntities = (text: string): string => {
    if (!text) return '';

    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&zwnj;/g, '')
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&bull;/g, '•')
        .replace(/&hellip;/g, '...');
};
