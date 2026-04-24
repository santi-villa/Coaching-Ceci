const { MercadoPagoConfig, Preference } = require('mercadopago');

const MAX_ITEM_QUANTITY = 10;
const DEFAULT_SHIPPING_COST = 1500;
const STORE_ORIGIN_ZIP = '1181';

const PRODUCTS = {
    libro_vol1: {
        id: 'libro_vol1',
        title: 'Comunicar para vivir más livianos',
        unit_price: 25000,
        currency_id: 'ARS',
    },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,13}$/;
const DNI_REGEX = /^\d{7,8}$/;
const ZIP_REGEX = /^[A-Z]?\d{4}[A-Z]{0,3}$/;

function jsonResponse(statusCode, payload) {
    return {
        statusCode,
        body: JSON.stringify(payload),
    };
}

function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeZip(value) {
    return normalizeText(value).replace(/\s+/g, '').toUpperCase();
}

function parseRequestBody(body) {
    try {
        return JSON.parse(body || '{}');
    } catch (error) {
        throw new Error('INVALID_JSON');
    }
}

function validateCustomer(customer, delivery) {
    const normalizedCustomer = {
        name: normalizeText(customer?.name),
        phone: normalizeText(customer?.phone).replace(/\D/g, ''),
        email: normalizeText(customer?.email).toLowerCase(),
        dni: normalizeText(customer?.dni).replace(/\D/g, ''),
        address: normalizeText(customer?.address),
        city: normalizeText(customer?.city),
        zip: normalizeZip(customer?.zip),
        province: normalizeText(customer?.province),
    };

    if (!normalizedCustomer.name || normalizedCustomer.name.length < 3) {
        throw new Error('INVALID_NAME');
    }

    if (!EMAIL_REGEX.test(normalizedCustomer.email)) {
        throw new Error('INVALID_EMAIL');
    }

    if (!PHONE_REGEX.test(normalizedCustomer.phone)) {
        throw new Error('INVALID_PHONE');
    }

    if (!DNI_REGEX.test(normalizedCustomer.dni)) {
        throw new Error('INVALID_DNI');
    }

    if (delivery === 'shipping') {
        if (!normalizedCustomer.address || normalizedCustomer.address.length < 5) {
            throw new Error('INVALID_ADDRESS');
        }

        if (!normalizedCustomer.city || normalizedCustomer.city.length < 2) {
            throw new Error('INVALID_CITY');
        }

        if (!ZIP_REGEX.test(normalizedCustomer.zip)) {
            throw new Error('INVALID_ZIP');
        }

        if (!normalizedCustomer.province || normalizedCustomer.province.length < 2) {
            throw new Error('INVALID_PROVINCE');
        }
    }

    return normalizedCustomer;
}

function sanitizeCart(cart) {
    if (!Array.isArray(cart) || cart.length === 0) {
        throw new Error('EMPTY_CART');
    }

    return cart.map((item) => {
        const productId = normalizeText(item?.productId || item?.id);
        const quantity = Number(item?.quantity);

        if (!productId || !PRODUCTS[productId]) {
            throw new Error('INVALID_PRODUCT');
        }

        if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_ITEM_QUANTITY) {
            throw new Error('INVALID_QUANTITY');
        }

        return { productId, quantity };
    });
}

async function quoteShipping(zipDest) {
    let shippingCost = DEFAULT_SHIPPING_COST;

    if (process.env.ZIPPIN_API_KEY && process.env.ZIPPIN_API_SECRET) {
        try {
            const authString = Buffer.from(
                `${process.env.ZIPPIN_API_KEY}:${process.env.ZIPPIN_API_SECRET}`
            ).toString('base64');

            const response = await fetch('https://api.zippin.com.ar/v1/quotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Basic ${authString}`,
                },
                body: JSON.stringify({
                    origin: { zip_code: STORE_ORIGIN_ZIP },
                    destination: { zip_code: zipDest },
                    parcels: [
                        { length: 20, width: 15, height: 5, weight: 500 },
                    ],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0 && Number(data[0].price) > 0) {
                    shippingCost = Number(data[0].price);
                }
            } else {
                console.log('Shipping quote failed', { status: response.status, zip: zipDest });
            }
        } catch (error) {
            console.error('Shipping quote request failed', {
                message: error.message,
                zip: zipDest,
            });
        }
    }

    return shippingCost;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Metodo no permitido' };
    }

    try {
        if (!process.env.MP_ACCESS_TOKEN) {
            throw new Error('MISSING_MP_ACCESS_TOKEN');
        }

        const { cart, delivery, customer } = parseRequestBody(event.body);

        if (delivery !== 'shipping' && delivery !== 'pickup') {
            return jsonResponse(400, { error: 'Tipo de entrega invalido.' });
        }

        const sanitizedCart = sanitizeCart(cart);
        const normalizedCustomer = validateCustomer(customer, delivery);

        const items = sanitizedCart.map(({ productId, quantity }) => {
            const product = PRODUCTS[productId];

            return {
                id: product.id,
                title: product.title,
                quantity,
                unit_price: product.unit_price,
                currency_id: product.currency_id,
            };
        });

        let shippingCost = 0;
        if (delivery === 'shipping') {
            shippingCost = await quoteShipping(normalizedCustomer.zip);
            items.push({
                id: 'envio',
                title: 'Costo de envio',
                quantity: 1,
                unit_price: shippingCost,
                currency_id: 'ARS',
            });
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

        let baseUrl = process.env.URL || 'https://ceciliarosso.netlify.app';
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            baseUrl = 'https://ceciliarosso.netlify.app';
        }
        if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`;
        }

        console.log('Checkout preference requested', {
            delivery,
            items: items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                unit_price: item.unit_price,
            })),
            shippingCost,
        });

        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items,
                metadata: {
                    customer_name: normalizedCustomer.name,
                    customer_phone: normalizedCustomer.phone,
                    customer_email: normalizedCustomer.email,
                    customer_dni: normalizedCustomer.dni,
                    delivery_type: delivery,
                    address: normalizedCustomer.address || 'Vacio',
                    city: normalizedCustomer.city || 'Vacio',
                    zip: normalizedCustomer.zip || 'Vacio',
                    province: normalizedCustomer.province || 'Vacio',
                },
                back_urls: {
                    success: `${baseUrl}/index.html?status=approved`,
                    failure: `${baseUrl}/index.html?status=failure`,
                    pending: `${baseUrl}/index.html?status=pending`,
                },
                notification_url: baseUrl.includes('localhost')
                    ? undefined
                    : `${baseUrl}/.netlify/functions/webhook`,
                auto_return: 'approved',
            },
        });

        return jsonResponse(200, { init_point: result.init_point });
    } catch (error) {
        const validationMessages = {
            INVALID_JSON: 'El cuerpo de la solicitud no es JSON valido.',
            EMPTY_CART: 'El carrito no puede estar vacio.',
            INVALID_PRODUCT: 'El producto enviado no es valido.',
            INVALID_QUANTITY: 'La cantidad debe ser un entero positivo entre 1 y 10.',
            INVALID_NAME: 'El nombre ingresado no es valido.',
            INVALID_EMAIL: 'El email ingresado no es valido.',
            INVALID_PHONE: 'El telefono ingresado no es valido.',
            INVALID_DNI: 'El DNI ingresado no es valido.',
            INVALID_ADDRESS: 'La direccion ingresada no es valida.',
            INVALID_CITY: 'La ciudad ingresada no es valida.',
            INVALID_ZIP: 'El codigo postal ingresado no es valido.',
            INVALID_PROVINCE: 'La provincia ingresada no es valida.',
        };

        if (validationMessages[error.message]) {
            return jsonResponse(400, { error: validationMessages[error.message] });
        }

        console.error('Error creating Mercado Pago preference', {
            message: error.message || error,
        });

        return jsonResponse(500, {
            error: 'Error creando preferencia',
            details: error.message || 'UNKNOWN_ERROR',
        });
    }
};
