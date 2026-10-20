const test = require('node:test');
const assert = require('node:assert');
const { addBusinessDays, describeDeliveryRange } = require('../src/js/delivery-dates');

test('salta fines de semana al sumar dias habiles', () => {
    const friday = new Date(2026, 9, 23);
    assert.strictEqual(addBusinessDays(friday, 1).getDate(), 26);
    assert.strictEqual(addBusinessDays(friday, 5).getDate(), 30);
});

test('describe el rango de entrega', () => {
    const monday = new Date(2026, 9, 19);
    assert.strictEqual(describeDeliveryRange(3, 5, monday), 'entre el 22 y el 26 de oct');
    assert.strictEqual(describeDeliveryRange(3, 7, new Date(2026, 9, 26)), 'entre el 29 de oct y el 4 de nov');
    assert.strictEqual(describeDeliveryRange(2, 2, monday), 'el 21 de oct');
    assert.strictEqual(describeDeliveryRange(null, 5, monday), '');
});
