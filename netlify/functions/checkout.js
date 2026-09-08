const { MercadoPagoConfig, Preference } = require('mercadopago');
const shippingProviderService = require('./lib/shipping-provider-service');
const {
    buildAddressKey,
    buildCartKey,
    calculateSubtotal,
    normalizeCartItems,
    normalizeAddress,
    numberOrZero,
    validateShippingOption
} = require('./lib/shipping-utils');

function cleanString(value, fallback = 'Vacio') {
    const cleaned = String(value || '').trim();
    return cleaned || fallback;
}

function sameNullableNumber(a, b) {
    if (!a && !b) return true;
    return Number(a) === Number(b);
}

function assertSameShippingOption(frontQuote, backendQuote) {
    validateShippingOption(frontQuote);
    validateShippingOption(backendQuote);

    const sameCore =
        cleanString(frontQuote.logistic_type, '') === cleanString(backendQuote.logistic_type, '') &&
        cleanString(frontQuote.service_type, '') === cleanString(backendQuote.service_type, '') &&
        sameNullableNumber(frontQuote.carrier_id, backendQuote.carrier_id) &&
        sameNullableNumber(frontQuote.rate_id, backendQuote.rate_id) &&
        sameNullableNumber(frontQuote.tariff_id, backendQuote.tariff_id);

    if (!sameCore) {
        throw new Error('La opcion de envio ya no coincide con la cotizacion vigente. Volve a calcular el envio.');
    }
}

function buildBaseUrl() {
    let baseUrl = process.env.URL || 'https://ceciliarosso.netlify.app';
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        baseUrl = 'https://ceciliarosso.netlify.app';
    }
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
    return baseUrl;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Metodo no permitido' };
    }

    try {
        const { cart, customer, shippingQuote, addressKey, cartKey } = JSON.parse(event.body || '{}');
        const cartItems = normalizeCartItems(cart);
        const customerData = customer || {};
        const address = normalizeAddress({
            postalCode: customerData.postalCode || customerData.zip,
            province: customerData.province,
            city: customerData.city,
            street: customerData.street,
            number: customerData.number,
            apartment: customerData.apartment
        });
        const subtotal = calculateSubtotal(cartItems);

        if (subtotal <= 0 || cartItems.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'El carrito esta vacio.' }) };
        }

        if (!shippingQuote || addressKey !== buildAddressKey(address) || cartKey !== buildCartKey(cartItems)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Calcula nuevamente el envio antes de pagar.' }) };
        }

        const backendQuote = await shippingProviderService.quoteHomeDelivery({
            cartItems,
            address,
            declaredValue: subtotal
        });
        assertSameShippingOption(shippingQuote, backendQuote.quote);

        const shippingCost = Math.round(numberOrZero(backendQuote.cost));
        if (shippingCost <= 0) {
            throw new Error('Zipnova devolvio un envio sin costo valido.');
        }

        const items = cartItems.map(item => ({
            id: cleanString(item.id, 'libro'),
            title: cleanString(item.title, 'Libro'),
            quantity: Math.max(1, Math.trunc(numberOrZero(item.quantity))),
            unit_price: numberOrZero(item.price),
            currency_id: 'ARS'
        }));

        items.push({
            id: 'envio',
            title: 'Envio a domicilio',
            quantity: 1,
            unit_price: shippingCost,
            currency_id: 'ARS'
        });

        const total = subtotal + shippingCost;
        const quoteSnapshot = backendQuote.quote;
        const orderId = `MP-${Date.now()}`;
        const baseUrl = buildBaseUrl();
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items,
                external_reference: orderId,
                metadata: {
                    order_id: orderId,
                    customer_name: cleanString(customerData.name),
                    customer_phone: cleanString(customerData.phone),
                    customer_email: cleanString(customerData.email),
                    customer_dni: cleanString(customerData.dni),
                    newsletter: customerData.newsletter ? 'si' : 'no',
                    delivery_type: 'shipping',
                    shipping_postal_code: address.postalCode,
                    shipping_province: address.province,
                    shipping_city: address.city,
                    shipping_street: address.street,
                    shipping_number: address.number,
                    shipping_apartment: address.apartment || 'Vacio',
                    subtotal: String(subtotal),
                    shipping_cost: String(shippingCost),
                    total: String(total),
                    shipping_method_visible: quoteSnapshot.shipping_method_visible || 'Envio a domicilio',
                    shipping_option_snapshot: JSON.stringify(quoteSnapshot),
                    shipping_logistic_type: cleanString(quoteSnapshot.logistic_type),
                    shipping_service_type: cleanString(quoteSnapshot.service_type),
                    shipping_carrier_id: quoteSnapshot.carrier_id ? String(quoteSnapshot.carrier_id) : 'Vacio',
                    shipping_carrier_name: cleanString(quoteSnapshot.carrier_name),
                    shipping_rate_id: quoteSnapshot.rate_id ? String(quoteSnapshot.rate_id) : 'Vacio',
                    shipping_tariff_id: quoteSnapshot.tariff_id ? String(quoteSnapshot.tariff_id) : 'Vacio',
                    cart_snapshot: JSON.stringify(cartItems)
                },
                back_urls: {
                    success: `${baseUrl}/index.html?status=approved`,
                    failure: `${baseUrl}/index.html?status=failure`,
                    pending: `${baseUrl}/index.html?status=pending`
                },
                notification_url: baseUrl.includes('localhost') ? undefined : `${baseUrl}/.netlify/functions/webhook`,
                auto_return: 'approved'
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ init_point: result.init_point, shippingCost, subtotal, total })
        };
    } catch (error) {
        console.error('Error detallado de Mercado Pago:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || 'Error creando preferencia'
            })
        };
    }
};
