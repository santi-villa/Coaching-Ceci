const test = require('node:test');
const assert = require('node:assert');
const { validateCustomer, normalizePhone, isValidDni } = require('../netlify/functions/lib/order-validation');
const { ValidationError, ProviderError, toErrorResponse } = require('../netlify/functions/lib/errors');
const { isRateLimited } = require('../netlify/functions/lib/rate-limit');

const valid = { name: 'Ana Perez', email: 'ana@mail.com', phone: '11 5555-1234', dni: '30.123.456' };

test('normaliza telefono y DNI con formato libre', () => {
    const customer = validateCustomer(valid);
    assert.strictEqual(customer.phone, '1155551234');
    assert.strictEqual(customer.dni, '30123456');
    assert.strictEqual(normalizePhone('+54 (11) 5555-1234'), '541155551234');
});

test('rechaza datos de contacto invalidos con mensaje claro', () => {
    assert.throws(() => validateCustomer({ ...valid, name: '' }), ValidationError);
    assert.throws(() => validateCustomer({ ...valid, email: 'ana@' }), /email/);
    assert.throws(() => validateCustomer({ ...valid, phone: '12345' }), /telefono/);
    assert.throws(() => validateCustomer({ ...valid, dni: '123' }), /DNI/);
    assert.strictEqual(isValidDni('0'), false);
});

test('los errores de proveedor no filtran detalles internos', () => {
    const response = toErrorResponse(new ProviderError('Zipnova rechazo la cotizacion (400): {"secret":1}'));
    assert.strictEqual(response.statusCode, 502);
    assert.ok(!response.body.includes('Zipnova'));
    assert.ok(!toErrorResponse(new Error('stack interno')).body.includes('stack'));
    assert.strictEqual(toErrorResponse(new ValidationError('Falta algo')).statusCode, 400);
});

test('limita pedidos repetidos por IP', () => {
    const event = { headers: { 'x-nf-client-connection-ip': '9.9.9.9' } };
    const results = Array.from({ length: 4 }, () => isRateLimited(event, { key: 'test', max: 3 }));
    assert.deepStrictEqual(results, [false, false, false, true]);
});
