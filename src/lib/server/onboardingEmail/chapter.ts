import type { AirtableNationalGroup } from '$lib/types.js'
import { fetchAllPages, type AirtableRecord } from '$lib/airtable.js'
import type { ChapterBlockData, ChapterLink } from './types.js'

// Same base/table/filter as src/routes/api/national-groups/+server.ts. Reusing the
// underlying fetch logic in-process (rather than an HTTP call to our own API) per the
// architecture decision record.
const AIRTABLE_URL = 'https://api.airtable.com/v0/appWPTGqZmUcs3NWu/tblEQJ26hxBAEkaP8'

// Same PauseAI Bluesky account appears in every old template's footer, including
// UK's (which otherwise swaps every other social handle for its own branded
// account) - confirmed global, not per-chapter. No `bluesky` field exists on
// NationalGroup/Airtable, so this is fixed rather than looked up.
const BLUESKY_LINK: ChapterLink = {
	label: 'Bluesky',
	url: 'https://bsky.app/profile/pauseai.bsky.social'
}

// Hardcoded fallback used when `country` has no matching National Groups record,
// matching the signoff/links email-templates/default-*.json and
// email-templates/not-volunteering-*.json currently use.
const GLOBAL_FALLBACK: ChapterBlockData = {
	isGlobalFallback: true,
	name: 'Global',
	leader: 'Maxime',
	links: [
		{ label: 'Discord', url: 'https://discord.gg/gTymKVFs7Z' },
		{ label: 'Welcome calls', url: 'https://luma.com/PauseAI?tag=welcome' },
		{ label: 'YouTube', url: 'https://www.youtube.com/@PauseAI' },
		{ label: 'Instagram', url: 'https://www.instagram.com/pause_ai/' },
		{ label: 'X', url: 'https://twitter.com/PauseAI' },
		BLUESKY_LINK,
		{ label: 'TikTok', url: 'https://tiktok.com/@pauseai' },
		{ label: 'Facebook', url: 'https://www.facebook.com/PauseAI/' }
	]
}

// Field -> display label, in the fixed order links should render.
const LINK_FIELDS: { field: keyof AirtableNationalGroup; label: string }[] = [
	{ field: 'website', label: 'Website' },
	{ field: 'discord', label: 'Discord' },
	{ field: 'whatsapp', label: 'WhatsApp' },
	{ field: 'luma', label: 'Events (Luma)' },
	{ field: 'substack', label: 'Substack' },
	{ field: 'x', label: 'X' },
	{ field: 'instagram', label: 'Instagram' },
	{ field: 'tiktok', label: 'TikTok' },
	{ field: 'facebook', label: 'Facebook' },
	{ field: 'youtube', label: 'YouTube' },
	{ field: 'linkedin', label: 'LinkedIn' },
	{ field: 'linktree', label: 'Linktree' }
]

function normalizeCountry(country: string): string {
	return country.trim().toLowerCase()
}

function recordToChapterBlock(record: AirtableRecord<AirtableNationalGroup>): ChapterBlockData {
	const leaderNames = (record.fields.leaders_name ?? []).map((n) => n.trim()).filter(Boolean)
	const leader = leaderNames.length > 0 ? leaderNames.join(' and ') : GLOBAL_FALLBACK.leader

	// These are free-text Airtable fields, so anything that is not a plain web link is dropped
	// rather than rendered into an href.
	const links: ChapterLink[] = LINK_FIELDS.map(({ field, label }) => {
		const value = record.fields[field]
		return { label, url: typeof value === 'string' ? value.trim() : '' }
	}).filter((link) => /^https?:\/\//i.test(link.url))

	const xIndex = links.findIndex((link) => link.label === 'X')
	links.splice(xIndex === -1 ? links.length : xIndex + 1, 0, BLUESKY_LINK)

	return {
		isGlobalFallback: false,
		name: (record.fields.country ?? '').trim(),
		leader,
		links
	}
}

/**
 * Looks up the live National Groups record matching `country` (exact, case-insensitive
 * match against the record's own free-text `country` field — the same key
 * src/routes/api/national-groups/+server.ts exposes as `NationalGroup.name`). Falls back
 * to the hardcoded global chapter when there's no match or `country` is empty.
 */
export async function getChapterForOnboardingEmail(
	country: string | undefined
): Promise<ChapterBlockData> {
	const cleanCountry = (country ?? '').trim()
	if (!cleanCountry) return GLOBAL_FALLBACK

	// Uncached and on every send, so a rate limit or an Airtable blip must not fail the render:
	// the caller would then send the fallback template, a different email, rather than this one
	// without its chapter block.
	let records: readonly AirtableRecord<AirtableNationalGroup>[]
	try {
		records = await fetchAllPages<AirtableNationalGroup>(fetch, AIRTABLE_URL, [], {
			filterByFormula: 'NOT({inactive})'
		})
	} catch (error) {
		console.error('National Groups lookup failed, rendering without a chapter:', error)
		return GLOBAL_FALLBACK
	}

	const match = records.find(
		(record) => normalizeCountry(record.fields.country ?? '') === normalizeCountry(cleanCountry)
	)

	return match ? recordToChapterBlock(match) : GLOBAL_FALLBACK
}

/**
 * The `country` values that currently resolve to a real chapter block (active
 * National Groups records), sorted. Anything not in this list — plus the empty
 * string — takes the global fallback. Exposed for the onboarding-email preview
 * tool's country picker; the render path itself matches free-text, not this list.
 */
export async function listActiveChapterCountries(): Promise<string[]> {
	const records = await fetchAllPages<AirtableNationalGroup>(fetch, AIRTABLE_URL, [], {
		filterByFormula: 'NOT({inactive})'
	})

	return records
		.map((record) => (record.fields.country ?? '').trim())
		.filter((country) => country.length > 0)
		.sort((a, b) => a.localeCompare(b))
}
