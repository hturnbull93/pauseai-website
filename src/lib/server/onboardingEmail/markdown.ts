// Minimal markdown support: `[label](url)` links, matching the style already used in the
// existing MailerSend templates' `plain_text` fields (see email-templates/*.json), and
// `**bold**`. Plain text output keeps the link syntax verbatim; HTML output converts both.

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

/**
 * Escapes `text` for safe HTML output, then converts `[label](url)` markdown
 * links into `<a>` tags. The URL itself is escaped but not otherwise validated —
 * callers control every URL that reaches this (chapter links, static copy).
 */
export function mdLineToHtml(text: string, linkColor: string): string {
	const escaped = escapeHtml(text)
	return escaped
		.replace(LINK_PATTERN, (_match, label: string, url: string) => {
			return `<a href="${url}" style="color: ${linkColor}; text-decoration: underline;">${label}</a>`
		})
		.replace(BOLD_PATTERN, '<strong>$1</strong>')
}
