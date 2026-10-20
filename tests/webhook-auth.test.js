const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { verifyMercadoPagoSignature, verifySharedSecret, escapeHtml } = require('../netlify/functions/lib/webhook-auth');

const SECRET = 'secreto-de-prueba';

function signedEvent({ dataId = '123', requestId = 'req-1', ts = '1700000000000', secret = SECRET } = {}) {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    return {
        headers: { 'X-Signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId },
        queryStringParameters: { 'data.id': dataId }
    };
}

test('acepta una firma de Mercado Pago valida', () => {
    assert.strictEqual(verifyMercadoPagoSignature(signedEvent(), SECRET), true);
});

test('rechaza firma con otro secreto', () => {
    assert.strictEqual(verifyMercadoPagoSignature(signedEvent({ secret: 'otro' }), SECRET), false);
});

test('rechaza si cambia el id del pago', () => {
    const event = signedEvent();
    event.queryStringParameters['data.id'] = '999';
    assert.strictEqual(verifyMercadoPagoSignature(event, SECRET), false);
});

test('rechaza si faltan headers o data.id', () => {
    assert.strictEqual(verifyMercadoPagoSignature({ headers: {}, queryStringParameters: {} }, SECRET), false);
    assert.strictEqual(verifyMercadoPagoSignature({}, SECRET), false);
});

test('secreto compartido por header o query', () => {
    assert.strictEqual(verifySharedSecret({ headers: { 'X-Webhook-Secret': 'abc' } }, 'abc'), true);
    assert.strictEqual(verifySharedSecret({ headers: {}, queryStringParameters: { secret: 'abc' } }, 'abc'), true);
    assert.strictEqual(verifySharedSecret({ headers: {}, queryStringParameters: { secret: 'x' } }, 'abc'), false);
    assert.strictEqual(verifySharedSecret({ headers: {} }, 'abc'), false);
});

test('escapeHtml neutraliza etiquetas', () => {
    assert.strictEqual(escapeHtml('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
});
