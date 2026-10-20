const test = require('node:test');
const assert = require('node:assert');
const { normalizeCartItems, calculateSubtotal, normalizeAddress, validateShippingOption } = require('../netlify/functions/lib/shipping-utils');

test('ignora el precio enviado por el cliente', () => {
    const [item] = normalizeCartItems([{ id: 'libro_vol1', quantity: 2, price: 1 }]);
    assert.strictEqual(item.price, 25000);
    assert.strictEqual(calculateSubtotal([{ id: 'libro_vol1', quantity: 2, price: 1 }]), 50000);
});

test('rechaza productos inexistentes, carrito vacio y cantidades invalidas', () => {
    assert.throws(() => normalizeCartItems([{ id: 'otro', quantity: 1 }]));
    assert.throws(() => normalizeCartItems([]));
    assert.throws(() => normalizeCartItems([{ id: 'libro_vol1', quantity: 0 }]));
});

test('la direccion exige los campos obligatorios', () => {
    assert.throws(() => normalizeAddress({ postalCode: '1000' }), /Faltan datos/);
    const ok = normalizeAddress({ postalCode: '1000', province: 'CABA', city: 'CABA', street: 'X', number: '1' });
    assert.strictEqual(ok.apartment, '');
});

test('solo acepta envio a domicilio con transportista permitido', () => {
    const base = { shipping_cost: 5000, service_type: 'standard_delivery', logistic_type: 'carrier_dropoff', carrier_name: 'OCA' };
    assert.strictEqual(validateShippingOption(base), true);
    assert.throws(() => validateShippingOption({ ...base, carrier_name: 'Otro' }));
    assert.throws(() => validateShippingOption({ ...base, service_type: 'pickup_point' }));
    assert.throws(() => validateShippingOption({ ...base, shipping_cost: 0 }));
});
