import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY!;
const IV = process.env.NEXT_PUBLIC_IV!;

export function encryptNumber(num: number): string {
    const encrypted = CryptoJS.AES.encrypt(num.toString(), CryptoJS.enc.Utf8.parse(SECRET_KEY), {
        iv: CryptoJS.enc.Utf8.parse(IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).ciphertext;
    return encrypted.toString(CryptoJS.enc.Hex); // Only numbers and letters
}

export function decryptNumber(encryptedHex: string): number {
    const encryptedWordArray = CryptoJS.enc.Hex.parse(encryptedHex);
    const base64Encrypted = CryptoJS.enc.Base64.stringify(encryptedWordArray);
    const bytes = CryptoJS.AES.decrypt(base64Encrypted, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
        iv: CryptoJS.enc.Utf8.parse(IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return Number(bytes.toString(CryptoJS.enc.Utf8));
}
