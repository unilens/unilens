// src/email.ts
// Sends transactional email via the SEND_EMAIL Cloudflare binding.
// Constructs a minimal MIME message — no external packages needed.

import { EmailMessage } from 'cloudflare:email';
import { Env } from './types';

const FROM = 'UniLens <notifications@unilens.net>';
const FROM_ADDR = 'notifications@unilens.net';

function buildRawEmail(to: string, subject: string, text: string): ReadableStream<Uint8Array> {
	const raw = [
		`Date: ${new Date().toUTCString()}`,
		`From: ${FROM}`,
		`To: ${to}`,
		`Subject: ${subject}`,
		`MIME-Version: 1.0`,
		`Content-Type: text/plain; charset=utf-8`,
		``,
		text,
	].join('\r\n');

	const encoded = new TextEncoder().encode(raw);
	return new ReadableStream({
		start(controller) {
			controller.enqueue(encoded);
			controller.close();
		},
	});
}

// Fails silently — email delivery should never block the main action.
export async function sendEmail(
	env: Env,
	to: string,
	subject: string,
	text: string
): Promise<void> {
	try {
		const message = new EmailMessage(FROM_ADDR, to, buildRawEmail(to, subject, text));
		await env.SEND_EMAIL.send(message);
	} catch {
		// Don't surface email errors to the user
	}
}