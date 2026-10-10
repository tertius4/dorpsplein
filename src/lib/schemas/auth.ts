import { z } from 'zod';

const newPassword = z.string().min(8, 'Minstens 8 karakters').max(128, 'Hoogstens 128 karakters');
const email = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email('Dit lyk nie na ’n geldige e-posadres nie'));

export const signUpSchema = z.object({
	name: z.string().trim().min(2, 'Vul jou naam in').max(80, 'Hoogstens 80 karakters'),
	email,
	_password: newPassword
});

export const signInSchema = z.object({
	email,
	// _<var> is a Svelte conversion. It wouldn't be returned after a failed attempt.
	_password: z.string().min(1, 'Vul jou wagwoord in'),
	redirect_to: z.string().optional()
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
	.object({
		token: z.string().min(1),
		_password: newPassword,
		_confirm: z.string()
	})
	.refine((d) => d._password === d._confirm, {
		message: 'Die wagwoorde stem nie ooreen nie',
		path: ['_confirm']
	});
