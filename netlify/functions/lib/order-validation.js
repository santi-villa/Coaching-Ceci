const { ValidationError } = require('./errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Acepta "11 5555-1234", "(011) 5555 1234" o "+54 11 5555 1234": deja solo los numeros.
function normalizePhone(value = '') {
    return String(value || '').replace(/[\s\-().+]/g, '');
}

function normalizeDni(value = '') {
    return String(value || '').replace(/\D/g, '');
}

function isValidEmail(value = '') {
    return EMAIL_REGEX.test(String(value || '').trim());
}

function isValidPhone(value = '') {
    return /^[0-9]{10,13}$/.test(normalizePhone(value));
}

function isValidDni(value = '') {
    return /^[0-9]{7,8}$/.test(normalizeDni(value));
}

// Mismas reglas que el formulario, para que un pago nunca se cobre con datos que el webhook rechazaria.
function validateCustomer(customer = {}) {
    const name = String(customer.name || '').trim();
    if (name.length < 2) throw new ValidationError('Completa tu nombre y apellido.');
    if (!isValidEmail(customer.email)) throw new ValidationError('Revisa el email: necesitamos una direccion valida.');
    if (!isValidPhone(customer.phone)) throw new ValidationError('Revisa el telefono: usa solo numeros, con codigo de area, sin 0 ni 15.');
    if (!isValidDni(customer.dni)) throw new ValidationError('Revisa el DNI: usa 7 u 8 numeros, sin puntos.');

    return {
        name,
        email: String(customer.email).trim(),
        phone: normalizePhone(customer.phone),
        dni: normalizeDni(customer.dni)
    };
}

module.exports = { isValidDni, isValidEmail, isValidPhone, normalizeDni, normalizePhone, validateCustomer };
