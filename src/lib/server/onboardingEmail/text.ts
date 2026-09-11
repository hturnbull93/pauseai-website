import type { FixedCopy } from './fixed.js'
import type { EmailBlock } from './blocks.js'

// `**bold**` has no plain-text form, and the old templates' plain_text carried none.
function stripBold(text: string): string {
	return text.replace(/\*\*([^*]+)\*\*/g, '$1')
}

/** Renders blocks + footer to plain text, matching the `[label](url)` markdown-link
 *  style already used in the existing templates' `plain_text` fields. */
export function renderText(blocks: EmailBlock[], fixed: FixedCopy): string {
	const parts: string[] = []

	for (const block of blocks) {
		switch (block.type) {
			case 'heading':
				parts.push(stripBold(block.text))
				break
			case 'paragraph':
				parts.push(stripBold(block.text))
				break
			case 'list':
				parts.push(
					block.items
						.map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
						.join('\n')
				)
				break
			case 'links':
				parts.push(block.items.map((item) => `[${item.label}](${item.url})`).join('\t'))
				break
		}
	}

	parts.push(fixed.addressLine)

	return parts.join('\n\n')
}
