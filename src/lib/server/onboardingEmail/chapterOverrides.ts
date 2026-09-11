import type { EmailContent } from './blocks.js'
import type { IntentGroup, OnboardingEmailLanguage } from './types.js'

// Chapters that send their own email instead of the shared copy. An override supplies the
// subject, greeting, body and sign-off; composeBlocks() still adds the fixed lines, in the
// override's language, so the override cannot leave out the confirm link or what we promise
// to send. Written by us from the chapter's own text and reviewed by the chapter. Changes
// are expected to be rare: chapters editing their own text is planned for the CRM.

export type ChapterOverride = {
	/** For the preview page. */
	name: string
	language: OnboardingEmailLanguage
	/** One version for everyone, or one per group. */
	content: (group: IntentGroup, firstName: string) => EmailContent
}

const UK_WHATSAPP = 'https://chat.whatsapp.com/F0nj2RjLNeB1P1hyoDFsTz'
const UK_EVENTS_CALENDAR = 'https://luma.com/pauseai.uk'
const UK_INTRO_CALL = 'https://calendar.app.google/w5t7EgCFwCGKcnAS7'

// From the live PauseAI UK non-volunteer template (zr6ke4nyyomgon12), minus its first step,
// which was the confirm link.
const uk: ChapterOverride = {
	name: 'PauseAI UK',
	language: 'en',
	content: (_group, firstName) => ({
		subject: `Welcome to PauseAI UK ${firstName}!`,
		htmlStyle: 'plain',
		greeting: [
			{ type: 'paragraph', text: `Hey ${firstName},` },
			{ type: 'paragraph', text: 'Welcome to our community!' }
		],
		body: [
			{ type: 'paragraph', text: "Here's how you can get involved in PauseAI UK:" },
			{
				type: 'list',
				ordered: true,
				items: [
					`Join the [PauseAI UK WhatsApp community](${UK_WHATSAPP}) and subscribe to our [UK events calendar](${UK_EVENTS_CALENDAR}).`,
					`If you'd like, [book a short call](${UK_INTRO_CALL}) with Joseph, PauseAI UK's director, so he can say hi and introduce you to the community.`
				]
			}
		],
		signoff: [
			{ type: 'paragraph', text: 'Looking forward to meeting you,' },
			{
				type: 'paragraph',
				text: '[Joseph](mailto:joseph@pauseai.uk) and [Matilda](mailto:matilda@pauseai.uk), the PauseAI UK Team'
			},
			{ type: 'paragraph', text: 'PS: if you have questions, just hit reply.' }
		]
	})
}

/** The override for a Members `country` value, or null for the shared copy. Matches the
 *  live script's `country.includes('United Kingdom')`. */
export function getChapterOverride(country: string | undefined): ChapterOverride | null {
	if (country?.includes('United Kingdom')) return uk
	return null
}
