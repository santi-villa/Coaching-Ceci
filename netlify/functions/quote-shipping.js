const shippingProviderService = require('./lib/shipping-provider-service');
const {
    buildAddressKey,
    buildCartKey,
    calculateSubtotal,
    normalizeCartItems,
    normalizeAddress
} = require('./lib/shipping-utils');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const cartItems = normalizeCartItems(body.cart);
        const address = normalizeAddress(body.address || {
            postalCode: body.postalCode || body.zip_dest,
            province: body.province,
            city: body.city || body.locality,
            street: body.street,
            number: body.number,
            apartment: body.apartment
        });
        const subtotal = calculateSubtotal(cartItems);

        if (subtotal <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'El carrito esta vacio.' }) };
        }

        const quoteResult = await shippingProviderService.quoteHomeDelivery({
            cartItems,
            address,
            declaredValue: subtotal
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                cost: quoteResult.cost,
                quote: quoteResult.quote,
                package: quoteResult.package,
                addressKey: buildAddressKey(address),
                cartKey: buildCartKey(cartItems)
            })
        };
    } catch (error) {
        console.error('Error quoting shipping:', error);
        return {
            statusCode: 502,
            body: JSON.stringify({
                error: error.message || 'No se pudo calcular el envio con Zipnova.'
            })
        };
    }
};
