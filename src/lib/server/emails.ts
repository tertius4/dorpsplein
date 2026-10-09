import type { Email } from './email.ts';

type Template = Omit<Email, 'to'>;

/** Veilige HTML: 'n naam soos "<script>" mag nooit as kode in 'n e-pos beland nie. */
function escape(value: string) {
	return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function layout(title: string, body: string) {
	return `<!doctype html><html lang="af"><body style="font-family:sans-serif;color:#1c1917;max-width:32rem;margin:auto;padding:1.5rem">
<h1 style="font-size:1.25rem">${title}</h1>${body}
<p style="color:#78716c;font-size:.85rem;margin-top:2rem">Dorpsplein · Orania</p></body></html>`;
}

function button(url: string, label: string) {
	return `<p><a href="${escape(url)}" style="display:inline-block;background:#1c1917;color:#fff;padding:.6rem 1rem;border-radius:.375rem;text-decoration:none">${label}</a></p>`;
}

export function verifyEmail({ name, url }: { name: string; url: string }): Template {
	return {
		subject: 'Bevestig jou e-posadres',
		text: `Hallo ${name}\n\nBevestig jou e-posadres vir Dorpsplein deur hierdie skakel oop te maak:\n${url}\n\nDie skakel is 24 uur geldig. As jy nie by Dorpsplein geregistreer het nie, ignoreer hierdie e-pos.`,
		html: layout(
			`Hallo ${escape(name)}`,
			`<p>Bevestig jou e-posadres vir Dorpsplein:</p>${button(url, 'Bevestig my e-pos')}
<p style="font-size:.85rem">Die skakel is 24 uur geldig. As jy nie by Dorpsplein geregistreer het nie, ignoreer hierdie e-pos.</p>`
		)
	};
}

export function accountExists({
	name,
	signInUrl,
	resetUrl
}: {
	name: string;
	signInUrl: string;
	resetUrl: string;
}): Template {
	return {
		subject: 'Jy het reeds ’n Dorpsplein-rekening',
		text: `Hallo ${name}\n\nIemand (hopelik jy) het probeer registreer met hierdie e-posadres, maar jy het reeds 'n rekening.\n\nTeken in: ${signInUrl}\nWagwoord vergeet? ${resetUrl}\n\nAs dit nie jy was nie, hoef jy niks te doen nie.`,
		html: layout(
			`Hallo ${escape(name)}`,
			`<p>Iemand (hopelik jy) het probeer registreer met hierdie e-posadres, maar jy het reeds ’n rekening.</p>${button(signInUrl, 'Teken in')}
<p style="font-size:.85rem">Wagwoord vergeet? <a href="${escape(resetUrl)}">Stel dit terug</a>. As dit nie jy was nie, hoef jy niks te doen nie.</p>`
		)
	};
}
