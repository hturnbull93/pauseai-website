import { url, verificationParameter } from '$lib/config.js'
import { baseContent } from './copy.js'
import { composeBlocks, groupOf, resolveIntentBucket } from './blocks.js'
import { getChapterForOnboardingEmail } from './chapter.js'
import { getChapterOverride } from './chapterOverrides.js'
import { FIXED_COPY } from './fixed.js'
import { renderHtml } from './html.js'
import { renderHtmlPlain } from './htmlPlain.js'
import { resolveOnboardingEmailLanguage } from './language.js'
import { stripMarkdown } from './markdown.js'
import { renderText } from './text.js'
import type {
	ChapterBlockData,
	IntentBucket,
	IntentGroup,
	OnboardingEmailLanguage,
	OnboardingEmailParams,
	RenderedOnboardingEmail
} from './types.js'

export type {
	OnboardingEmailParams,
	RenderedOnboardingEmail,
	OnboardingEmailLanguage,
	OnboardingEmailHtmlStyle
} from './types.js'

export type OnboardingEmailResolution = {
	bucket: IntentBucket
	group: IntentGroup
	language: OnboardingEmailLanguage
	/** Name of the chapter override in use, if any. */
	override: string | null
	/** Null with an override too: an override carries its own chapter content. */
	chapter: ChapterBlockData | null
}

/** Which version of the email a signup gets. Exported for the preview pages. */
export async function resolveOnboardingEmail(
	params: OnboardingEmailParams
): Promise<OnboardingEmailResolution> {
	const bucket = resolveIntentBucket(params.intent)
	const group = groupOf(bucket)
	const override = getChapterOverride(params.country, group)
	const detected =
		params.languageOverride ?? resolveOnboardingEmailLanguage(params.country, params.languages)

	// Spanish speakers share one community, PauseAI en Español, so no country's chapter block
	// is singled out for them, whichever email they get.
	const chapter =
		override || detected === 'es' ? null : await getChapterForOnboardingEmail(params.country)

	return {
		bucket,
		group,
		// Only English has a non-volunteer version, so Spanish non-volunteers get it, as today.
		language: override ? override.language : group === 'volunteer' ? detected : 'en',
		override: override?.name ?? null,
		chapter
	}
}

/**
 * Renders the onboarding welcome email (subject + html + text) for a given signup: the
 * shared copy or a chapter's override, inside the skeleton in blocks.ts.
 */
export async function renderOnboardingEmail(
	params: OnboardingEmailParams
): Promise<RenderedOnboardingEmail> {
	if (!params.airtable_id) {
		throw new Error('airtable_id is required to build the verification link')
	}
	const verificationLink = `${url}/verify?table=join&${verificationParameter}=${params.airtable_id}`

	const resolution = await resolveOnboardingEmail(params)
	const { bucket, group, language, chapter } = resolution
	const override = getChapterOverride(params.country, group)
	const firstName = stripMarkdown(params.firstName)
	const content = override
		? override.content(firstName)
		: baseContent(language === 'es' ? 'es' : 'en', bucket, chapter, firstName)
	const fixed = FIXED_COPY[language]
	const blocks = composeBlocks(content, fixed, bucket, verificationLink)

	// Must be absolute URLs: email clients don't resolve relative paths.
	const htmlStyle = params.htmlStyle ?? content.htmlStyle ?? 'rich'
	const html =
		htmlStyle === 'plain'
			? renderHtmlPlain(blocks, fixed, language, `${url}/pauseai-logo-email.png`)
			: renderHtml(blocks, fixed, language, `${url}/pauseai-icon-email.png`)

	return {
		subject: content.subject,
		html,
		text: renderText(blocks, fixed)
	}
}
