import { getRuntimeSettings } from '@/service/SettingsService';

/**
 * Split text into segments, marking matches with their CSS class.
 * @param {string} text - The text to process
 * @param {Array<{text: string, cls: string}>} extraPatterns - Additional patterns (e.g. search term)
 * @returns {Array<{text: string, cls: string}>} Segments with CSS class ('' for normal text)
 */
export function highlightSegments(text, extraPatterns = []) {
    if (!text) return [{ text: '', cls: '' }];

    const keywords = getRuntimeSettings().keywords || [];
    const allPatterns = [];

    // Extra patterns first (higher priority in alternation)
    for (const p of extraPatterns) {
        if (p.text) allPatterns.push({ raw: p.text, cls: p.cls || 'text-primary' });
    }
    // Keywords
    for (const k of keywords) {
        if (k) allPatterns.push({ raw: k, cls: 'text-primary' });
    }

    if (!allPatterns.length) return [{ text, cls: '' }];

    // Sort longer patterns first so "fuzzing tool" matches before "fuzz"
    allPatterns.sort((a, b) => b.raw.length - a.raw.length);

    const escaped = allPatterns.map(p => p.raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ text: text.slice(lastIndex, match.index), cls: '' });
        }
        // Determine which pattern matched to get the correct class
        const matchLower = match[0].toLowerCase();
        let cls = 'text-primary';
        for (const p of allPatterns) {
            if (matchLower.length === p.raw.length && matchLower === p.raw.toLowerCase()) {
                cls = p.cls;
                break;
            }
        }
        segments.push({ text: match[0], cls });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        segments.push({ text: text.slice(lastIndex), cls: '' });
    }

    return segments.length ? segments : [{ text, cls: '' }];
}
