// cspell:ignore Kwikstaartlaan
import type { IntentBucket, OnboardingEmailLanguage } from './types.js'

// The lines every onboarding email carries, whoever wrote the rest of it. composeBlocks()
// places them, so neither the shared copy nor a chapter override can drop one: the
// confirm link is the reason the email exists, and the newsletter and critical alert
// line repeats a promise the signup form already made.
//
// A language only a chapter override is written in still needs an entry here.

export type FixedCopy = {
	/** The verification link and the "ignore this" line, straight after the greeting. */
	confirm: (verificationLink: string) => string
	/** What we will send them, just before the sign-off. Varies with the bucket in English
	 *  because Irina's copy does; one line serves every bucket elsewhere. */
	newsletter: (bucket: IntentBucket) => string
	addressLine: string
}

const en: FixedCopy = {
	confirm: (link) =>
		`To confirm your email address, click [this link](${link}). If you didn't sign up, you can ignore this message.`,
	newsletter: (bucket) => {
		switch (bucket) {
			case 'none':
				return "If you opted in, we'll keep you informed about important news, campaign updates, and opportunities to take a more active role in this movement, including local opportunities where there's an active chapter near you. Either way, we may occasionally send you a critical alert."
			case 'act-now':
				return "If you opted in, we'll keep you in the loop about future actions, campaign updates, and other opportunities to support the PauseAI movement, including local opportunities where there's an active chapter near you. Either way, we may occasionally send you a critical alert."
			case 'volunteer':
				return "If you opted in to our newsletter, you'll receive the PauseAI monthly update on upcoming actions and events. Either way, we may occasionally send you a critical alert."
		}
	},
	addressLine: 'PauseAI, Box C5957, Kwikstaartlaan 42, 3704GS Zeist, The Netherlands'
}

// From the live Spanish template, which only serves volunteers. The critical alert
// sentence is new and needs a fluent reader.
const es: FixedCopy = {
	confirm: (link) =>
		`Para verificar tu dirección de email, haz clic en [este link](${link}). Si no solicitaste unirte, puedes ignorar este mensaje.`,
	newsletter: () =>
		'Si te suscribiste a nuestra lista de correo, recibirás el boletín mensual de PauseAI que te mantendrá al día sobre las próximas acciones y eventos. En cualquier caso, es posible que ocasionalmente te enviemos una alerta crítica.',
	addressLine: 'PauseAI, Box C5957, Kwikstaartlaan 42, 3704GS Zeist, Países Bajos'
}

export const FIXED_COPY: Record<OnboardingEmailLanguage, FixedCopy> = { en, es }
