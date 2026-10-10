import { RESEND_API_KEY, EMAIL_FROM } from '$app/env/private';
import { APP_ENV } from '$app/env/public';

export type Email = {
	to: string;
	subject: string;
	text: string; // altyd: vir ou e-poskliënte en spamfilters
	html: string;
};

/**
 * Send an email via Resend.
 * If local, print to the console.
 */
export async function sendEmail(email: Email): Promise<void> {
	if (!RESEND_API_KEY) {
		if (APP_ENV !== 'local') throw new Error('RESEND_API_KEY ontbreek');
		console.info(`\n📧 Aan: ${email.to}\n   Onderwerp: ${email.subject}\n\n${email.text}\n`);
		return;
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: EMAIL_FROM,
			to: [email.to],
			subject: email.subject,
			text: email.text,
			html: email.html
		})
	});

	if (!response.ok) {
		throw new Error(`Resend ${response.status}: ${await response.text()}`);
	}
}
