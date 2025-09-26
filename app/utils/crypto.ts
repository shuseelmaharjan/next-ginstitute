import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET;

function getSecretKey(): string {
	if (!SECRET_KEY) {
		throw new Error('SECRET_KEY is not defined');
	}
	return SECRET_KEY;
}

export function encrypt(text: string): string {
	return CryptoJS.AES.encrypt(text, getSecretKey()).toString();
}

export function decrypt(ciphertext: string): string {
	const bytes = CryptoJS.AES.decrypt(ciphertext, getSecretKey());
	return bytes.toString(CryptoJS.enc.Utf8);
}

