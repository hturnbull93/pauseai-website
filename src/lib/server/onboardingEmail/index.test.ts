import { describe, expect, it, vi } from 'vitest'
import type { ChapterBlockData } from './types.js'

// Stands in for the live National Groups table: one chapter with links, one without.
const CHAPTERS: Record<string, ChapterBlockData> = {
	germany: {
		name: 'Germany',
		links: [{ label: 'WhatsApp', url: 'https://chat.whatsapp.com/example' }]
	},
	belgium: { name: 'Belgium', links: [] },
	spain: { name: 'Spain', links: [{ label: 'Website', url: 'https://pauseai.es' }] },
	sweden: { name: 'Sweden', links: [{ label: 'Website', url: 'https://pauseai.se/' }] }
}

vi.mock('./chapter.js', () => ({
	getChapterForOnboardingEmail: async (country: string | undefined) =>
		CHAPTERS[(country ?? '').trim().toLowerCase()] ?? null
}))

const { renderOnboardingEmail } = await import('./index.js')

const RECORD_ID = 'recTest1234567890'
const INTENTS = ['None', 'Keep informed', 'Act now', 'Volunteer', 'Lead', '', 'Something new']
const COUNTRIES = ['', 'Germany', 'Belgium', 'Spain', 'Mexico', 'United Kingdom', 'United States']

function render(country: string, intent: string, firstName = 'Alex') {
	return renderOnboardingEmail({ firstName, country, intent, airtable_id: RECORD_ID })
}

describe('renderOnboardingEmail', () => {
	// The live script falls back to a template when the link is missing, so a regression here
	// would not strand anyone, but it would silently stop the composed path.
	it('always carries the verification link and the critical alert promise', async () => {
		for (const country of COUNTRIES) {
			for (const intent of INTENTS) {
				const email = await render(country, intent)
				const where = `${country || '(none)'} / ${intent || '(empty)'}`
				expect(email.html, where).toContain(`verificationKey=${RECORD_ID}`)
				expect(email.text, where).toContain(`verificationKey=${RECORD_ID}`)
				expect(email.text, where).toMatch(/critical alert|alerta crítica/)
			}
		}
	})

	it('promises chapter contact to volunteers only', async () => {
		const volunteer = await render('Germany', 'Volunteer')
		expect(volunteer.text).toContain('PauseAI Germany will be in touch')
		expect(volunteer.text).toContain('https://chat.whatsapp.com/example')

		const nonVolunteer = await render('Germany', 'Act now')
		expect(nonVolunteer.text).not.toContain('will be in touch')
		expect(nonVolunteer.text).toContain("There's a PauseAI chapter in Germany.")
		expect(nonVolunteer.text).toContain('https://chat.whatsapp.com/example')

		const noChapter = await render('', 'Lead')
		expect(noChapter.text).toContain('Our onboarding team will be in touch.')
	})

	it('keeps the promise but drops the links row for a chapter with no links', async () => {
		expect((await render('Belgium', 'Volunteer')).text).toContain(
			'PauseAI Belgium will be in touch'
		)
		expect((await render('Belgium', 'None')).text).not.toContain('PauseAI chapter in')
	})

	it('treats every Spanish-speaking country alike', async () => {
		for (const country of ['Spain', 'Mexico']) {
			const volunteer = await render(country, 'Volunteer')
			expect(volunteer.subject).toContain('Bienvenido')
			expect(volunteer.text).not.toContain('PauseAI Spain')
			const nonVolunteer = await render(country, 'None')
			expect(nonVolunteer.subject).toBe('Thanks for signing up to PauseAI')
			expect(nonVolunteer.text).not.toContain('PauseAI chapter in')
		}
	})

	it('gives the no-intent copy to anything that is not Act now, Volunteer or Lead', async () => {
		for (const intent of ['None', 'Keep informed', '', 'Something new']) {
			expect((await render('', intent)).subject).toBe('Thanks for signing up to PauseAI')
		}
		expect((await render('', 'Act now')).subject).toBe('Thanks for taking action with PauseAI')
	})

	it('uses the UK override for every UK signup', async () => {
		for (const intent of ['None', 'Volunteer']) {
			const email = await render('United Kingdom', intent)
			expect(email.subject).toBe('Welcome to PauseAI UK Alex!')
			expect(email.text).toContain('F0nj2RjLNeB1P1hyoDFsTz')
		}
	})

	it("does not let a signup's name render as a link", async () => {
		const email = await render('', 'None', '[Verify here](https://example.com)')
		expect(email.html).not.toContain('href="https://example.com"')
	})
})
