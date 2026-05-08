const { MercadoPagoConfig, Payment } = require('mercadopago');
const shippingProviderService = require('./lib/shipping-provider-service');
const { numberOrZero } = require('./lib/shipping-utils');

function getPaymentId(body) {
    if (body?.['data.id']) return body['data.id'];
    if (body?.data?.id) return body.data.id;
    if (body?.id) return body.id;
    if (typeof body?.resource === 'string') {
        const match = body.resource.match(/\/payments\/(\d+)/);
        if (match) return match[1];
    }
    return null;
}

function isPaymentNotification(body) {
    return body?.type === 'payment' ||
        body?.topic === 'payment' ||
        body?.action?.startsWith('payment.') ||
        (typeof body?.resource === 'string' && body.resource.includes('/payments/'));
}

function metadataValue(metadata, key, fallback = '') {
    const value = metadata?.[key];
    if (value === undefined || value === null || value === '' || value === 'Vacio') return fallback;
    return value;
}

function parseJsonMetadata(metadata, key, fallback) {
    const raw = metadataValue(metadata, key, '');
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error(`No se pudo parsear metadata ${key}:`, error);
        return fallback;
    }
}

function getCustomer(metadata) {
    return {
        name: metadataValue(metadata, 'customer_name', 'Comprador'),
        dni: metadataValue(metadata, 'customer_dni', '0'),
        email: metadataValue(metadata, 'customer_email', 'nodata@example.com'),
        phone: metadataValue(metadata, 'customer_phone', '0')
    };
}

function getAddress(metadata) {
    return {
        postalCode: metadataValue(metadata, 'shipping_postal_code', metadataValue(metadata, 'zip', '')),
        province: metadataValue(metadata, 'shipping_province', metadataValue(metadata, 'province', '')),
        city: metadataValue(metadata, 'shipping_city', metadataValue(metadata, 'city', '')),
        street: metadataValue(metadata, 'shipping_street', ''),
        number: metadataValue(metadata, 'shipping_number', ''),
        apartment: metadataValue(metadata, 'shipping_apartment', '')
    };
}

function normalizeShipmentResult(result = {}) {
    return {
        zipnova_shipment_id: result.shipment_id || '',
        tracking_number: result.tracking_number || '',
        tracking_url: result.tracking_url || '',
        label_url: result.label_url || '',
        carrier_name: result.carrier_name || '',
        shipping_status: result.status || ''
    };
}

async function postJson(url, payload, headers = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
    }

    return response;
}

async function sendBrevoEmails({ metadata, shippingRecord }) {
    const brevoKey = (process.env.BREVO_API_KEY || '').trim();
    const sellerEmail = (process.env.SELLER_EMAIL || 'rossoceci@gmail.com').trim();
    if (!brevoKey) {
        console.log('No se envia correo porque falta BREVO_API_KEY.');
        return;
    }

    const customer = getCustomer(metadata);
    const address = getAddress(metadata);
    const headers = {
        'Accept': 'application/json',
        'api-key': brevoKey
    };
    const trackingText = shippingRecord.tracking_url || 'Pendiente de generacion';

    await postJson('https://api.brevo.com/v3/smtp/email', {
        sender: { name: 'Sistema Tienda', email: sellerEmail },
        to: [{ email: sellerEmail, name: 'Cecilia Rosso' }],
        subject: 'Nueva venta aprobada - Libro',
        htmlContent: `
            <div style="font-family:sans-serif;color:#333;max-width:640px;margin:0 auto">
                <h1>Nueva venta aprobada</h1>
                <p><strong>Comprador:</strong> ${customer.name}</p>
                <p><strong>Email:</strong> ${customer.email}</p>
                <p><strong>Telefono:</strong> ${customer.phone}</p>
                <p><strong>DNI:</strong> ${customer.dni}</p>
                <p><strong>Direccion:</strong> ${address.street} ${address.number} ${address.apartment}, ${address.city}, ${address.province} (CP ${address.postalCode})</p>
                <p><strong>Envio:</strong> ${shippingRecord.shipping_status || 'Pendiente'} - ${trackingText}</p>
            </div>
        `
    }, headers);

    if (customer.email && customer.email !== 'nodata@example.com') {
        await postJson('https://api.brevo.com/v3/smtp/email', {
            sender: { name: 'Cecilia Karina Rosso', email: sellerEmail },
            to: [{ email: customer.email, name: customer.name }],
            subject: 'Recibimos tu pago',
            htmlContent: `
                <div style="font-family:sans-serif;color:#333;max-width:640px;margin:0 auto">
                    <h1>Gracias por tu compra</h1>
                    <p>Hola ${customer.name.split(' ')[0] || ''}, recibimos el pago de tu ejemplar.</p>
                    <p>Tu envio a domicilio queda en preparacion. Seguimiento: ${trackingText}</p>
                </div>
            `
        }, headers);
    }
}

async function sendWhatsApp(metadata) {
    const phone = (process.env.CALLMEBOT_PHONE || '').trim();
    const apiKey = (process.env.CALLMEBOT_API_KEY || '').trim();
    if (!phone || !apiKey) return;

    const text = `Nueva venta de libro\nComprador: ${metadataValue(metadata, 'customer_name', '-')}\nTelefono: ${metadataValue(metadata, 'customer_phone', '-')}\nEnvio: domicilio`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`CallMeBot ${response.status}`);
}

async function registerOrderInSheets(row) {
    const scriptUrl = process.env.GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbyXPXUuMBJnMNpKOeD6vuzEf_AkCKE5weYlVh6Qj4fmzyyV3Jl_mWBwgbMRz24ZLQcl1Q/exec';
    if (!scriptUrl || !scriptUrl.includes('script.google.com')) return;

    await postJson(scriptUrl, row);
}

function buildSheetRow({ paymentId, paymentData, metadata, shipmentRecord, zipnovaError }) {
    const address = getAddress(metadata);
    const now = new Date().toISOString();
    const orderStatus = paymentData.status === 'approved' ? 'paid' : paymentData.status;

    return {
        order_id: metadataValue(metadata, 'order_id', paymentData.external_reference || `MP-${paymentId}`),
        payment_id: String(paymentId),
        customer_name: metadataValue(metadata, 'customer_name', ''),
        customer_email: metadataValue(metadata, 'customer_email', ''),
        customer_phone: metadataValue(metadata, 'customer_phone', ''),
        shipping_postal_code: address.postalCode,
        shipping_province: address.province,
        shipping_city: address.city,
        shipping_street: address.street,
        shipping_number: address.number,
        shipping_apartment: address.apartment,
        shipping_method_visible: metadataValue(metadata, 'shipping_method_visible', 'Envio a domicilio'),
        shipping_price: numberOrZero(metadataValue(metadata, 'shipping_cost', 0)),
        shipping_option_snapshot: metadataValue(metadata, 'shipping_option_snapshot', ''),
        subtotal: numberOrZero(metadataValue(metadata, 'subtotal', 0)),
        total: numberOrZero(metadataValue(metadata, 'total', paymentData.transaction_amount || 0)),
        payment_status: paymentData.status,
        order_status: orderStatus,
        shipping_status: shipmentRecord.shipping_status || (zipnovaError ? 'shipping_creation_failed' : 'not_created'),
        zipnova_shipment_id: shipmentRecord.zipnova_shipment_id || '',
        tracking_number: shipmentRecord.tracking_number || '',
        tracking_url: shipmentRecord.tracking_url || '',
        label_url: shipmentRecord.label_url || '',
        zipnova_error: zipnovaError || '',
        created_at: paymentData.date_created || now,
        updated_at: now
    };
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        let parsedBody = {};
        if (event.body) {
            try {
                parsedBody = JSON.parse(event.body);
            } catch (parseError) {
                console.log('Webhook MP sin body JSON valido:', event.body);
            }
        }

        const body = {
            ...(event.queryStringParameters || {}),
            ...parsedBody
        };

        const paymentId = getPaymentId(body);
        if (!isPaymentNotification(body) || !paymentId) {
            return { statusCode: 200, body: 'OK' };
        }

        const mpAccessToken = (process.env.MP_ACCESS_TOKEN || '').trim();
        if (!mpAccessToken) {
            console.error('MP_ACCESS_TOKEN no configurado.');
            return { statusCode: 200, body: 'Token no configurado' };
        }

        const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
        const paymentClient = new Payment(client);
        const paymentData = await paymentClient.get({ id: paymentId });
        const metadata = paymentData.metadata || {};
        let shipmentRecord = {};
        let zipnovaError = '';

        if (paymentData.status === 'approved') {
            try {
                const shippingQuote = parseJsonMetadata(metadata, 'shipping_option_snapshot', null);
                const cartItems = parseJsonMetadata(metadata, 'cart_snapshot', []);

                shipmentRecord = normalizeShipmentResult(await shippingProviderService.createShipment({
                    paymentId,
                    customer: getCustomer(metadata),
                    address: getAddress(metadata),
                    cartItems,
                    declaredValue: numberOrZero(metadataValue(metadata, 'subtotal', paymentData.transaction_amount || 0)),
                    shippingQuote
                }));
                console.log('Envio creado en Zipnova:', JSON.stringify(shipmentRecord));
            } catch (error) {
                zipnovaError = error.message || String(error);
                shipmentRecord = { shipping_status: 'shipping_creation_failed' };
                console.error('No se pudo crear el envio en Zipnova:', zipnovaError);
            }

            try {
                await sendBrevoEmails({ metadata, shippingRecord: shipmentRecord });
            } catch (error) {
                console.error('Error enviando emails:', error.message || error);
            }

            try {
                await sendWhatsApp(metadata);
            } catch (error) {
                console.error('Error enviando WhatsApp:', error.message || error);
            }
        }

        try {
            const sheetRow = buildSheetRow({ paymentId, paymentData, metadata, shipmentRecord, zipnovaError });
            await registerOrderInSheets(sheetRow);
            console.log('Venta registrada en Google Sheets.');
        } catch (error) {
            console.error('Error registrando en Google Sheets:', error.message || error);
        }

        return { statusCode: 200, body: 'OK' };
    } catch (error) {
        console.error('Error interno procesando webhook:', error);
        return { statusCode: 500, body: 'Error interno' };
    }
};
