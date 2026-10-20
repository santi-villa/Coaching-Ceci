const crypto = require('crypto');

function safeEqual(a, b) {
    const bufA = Buffer.from(String(a || ''));
    const bufB = Buffer.from(String(b || ''));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function getHeader(headers = {}, name) {
    const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : '';
}

// Mercado Pago firma cada notificacion: x-signature = "ts=...,v1=<hmac sha256>".
// El mensaje firmado es `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`.
function verifyMercadoPagoSignature(event, secret) {
    const signature = getHeader(event.headers, 'x-signature');
    const requestId = getHeader(event.headers, 'x-request-id');
    const dataId = String(event.queryStringParameters?.['data.id'] || '').toLowerCase();

    const parts = Object.fromEntries(
        String(signature).split(',').map(part => part.trim().split('=').map(s => s.trim()))
    );
    if (!parts.ts || !parts.v1 || !dataId) return false;

    const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
    const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    return safeEqual(expected, parts.v1);
}

// Zipnova no firma los avisos, asi que usamos un secreto compartido en la URL
// (?secret=...) o en el header x-webhook-secret.
function verifySharedSecret(event, secret) {
    const provided = getHeader(event.headers, 'x-webhook-secret') || event.queryStringParameters?.secret || '';
    return safeEqual(provided, secret);
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = { verifyMercadoPagoSignature, verifySharedSecret, escapeHtml };
