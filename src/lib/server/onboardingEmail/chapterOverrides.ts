import type { EmailContent } from './blocks.js'
import type { ChapterLink, IntentGroup, OnboardingEmailLanguage } from './types.js'

// Chapters that send their own email instead of the shared copy. An override supplies the
// subject, greeting, body and sign-off; composeBlocks() still adds the fixed lines, in the
// override's language, so the override cannot leave out the confirm link or what we promise
// to send. Written by us from the chapter's own text and reviewed by the chapter. Changes
// are expected to be rare: chapters editing their own text is planned for the CRM.

type ChapterOverride = {
	/** For the preview page. */
	name: string
	language: OnboardingEmailLanguage
	/** One version for everyone, or one per group. A group left out gets the shared copy. */
	content: Partial<Record<IntentGroup, (firstName: string) => EmailContent>>
}

export type ResolvedOverride = {
	name: string
	language: OnboardingEmailLanguage
	content: (firstName: string) => EmailContent
}

const VIDEO_URL = 'https://www.youtube.com/watch?v=ZHxJwv4TdJo'
const GLOBAL_DISCORD_URL = 'https://discord.gg/gTymKVFs7Z'

// Both UK emails are ported from the live PauseAI UK templates. The WhatsApp link is the
// "PauseAI UK Waiting Room" invite; the UK chapter row's link opens a London protests group.
const UK_WHATSAPP = 'https://chat.whatsapp.com/F0nj2RjLNeB1P1hyoDFsTz'
const UK_EVENTS_CALENDAR = 'https://luma.com/pauseai.uk'
const UK_INTRO_CALL = 'https://calendar.app.google/w5t7EgCFwCGKcnAS7'

const UK_SOCIALS: ChapterLink[] = [
	{ label: 'YouTube', url: 'https://www.youtube.com/@PauseAI-UK' },
	{ label: 'Discord', url: 'https://discord.gg/2XXWXvErfA' },
	{ label: 'Instagram', url: 'https://www.instagram.com/pauseai_uk' },
	{ label: 'X', url: 'https://x.com/pauseai_uk' },
	{ label: 'Bluesky', url: 'https://bsky.app/profile/pauseai.bsky.social' },
	{ label: 'TikTok', url: 'https://www.tiktok.com/@pauseai_uk' },
	{ label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61587358827177' }
]

const uk: ChapterOverride = {
	name: 'PauseAI UK',
	language: 'en',
	content: {
		// From version 1 of jy7zpl97rdrg5vx6, which runs a MailerSend split test: version 2 is
		// the short note below, so UK volunteers currently get one or the other at random. The
		// composed path sends one email, so this reproduces version 1 until PauseAI UK says which
		// of the two they want.
		volunteer: (firstName) => ({
			subject: `Welcome to PauseAI UK ${firstName}!`,
			greeting: [
				{ type: 'heading', text: `Welcome to PauseAI UK, ${firstName}.` },
				{
					type: 'paragraph',
					text: "**Let's work together to stop the development of dangerous AI**"
				}
			],
			body: [
				{
					type: 'paragraph',
					text: "We're thrilled to have you join our growing volunteer network. We are committed to ensuring that artificial intelligence is developed slowly and safely in a way that benefits all of humanity. And that it isn't left to the whims of companies in a reckless race to build AI that can replace humans. Watch our video below for a summary of the Pause position:"
				},
				{ type: 'paragraph', text: `[Video Introduction](${VIDEO_URL})` },
				{ type: 'heading', text: 'Connect With Your Community' },
				{
					type: 'paragraph',
					text: `Join the [PauseAI UK WhatsApp community](${UK_WHATSAPP}) to keep up with our events.`
				},
				{
					type: 'paragraph',
					text: `You can also join the PauseAI Global [Discord server](${GLOBAL_DISCORD_URL}) to meet the international PauseAI community.`
				},
				{ type: 'heading', text: 'Next steps' },
				{
					type: 'paragraph',
					text: `Please [book a 10 minute call](${UK_INTRO_CALL}) with Joseph, the Director of PauseAI UK, so he can say hi and introduce you to the community. Or reply to this email if you have a question.`
				},
				{
					type: 'paragraph',
					text: `New events will be announced in the [WhatsApp community](${UK_WHATSAPP}).`
				}
			],
			signoff: [
				{
					type: 'paragraph',
					text: 'Welcome aboard! At PauseAI, we believe in the power of collective action. Together, we can take action to prevent the catastrophic impacts of the development of Artificial Intelligence.'
				},
				{ type: 'paragraph', text: 'Best wishes,' },
				{
					type: 'paragraph',
					text: '[Joseph](mailto:joseph@pauseai.info) and [Matilda](mailto:matilda@pauseai.info), The PauseAI UK Team'
				},
				{ type: 'links', items: UK_SOCIALS }
			]
		}),
		// From zr6ke4nyyomgon12, minus its first step, which was the confirm link.
		'non-volunteer': (firstName) => ({
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
}

/** The override for a Members `country` value and group, or null for the shared copy.
 *  Countries are matched as the live script matches them, with `includes`. */
export function getChapterOverride(
	country: string | undefined,
	group: IntentGroup
): ResolvedOverride | null {
	const override = country?.includes('United Kingdom') ? uk : null
	const content = override?.content[group]
	return override && content ? { name: override.name, language: override.language, content } : null
}
