const shippingProviderService = require('./lib/shipping-provider-service');
const {
    calculateSubtotal,
    normalizeAddress,
    normalizeCartItems,
    numberOrZero,
    validateShippingOption
} = require('./lib/shipping-utils');

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

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatMoney(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(numberOrZero(value));
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

function isValidEmail(value = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isValidPhone(value = '') {
    return /^[0-9]{10,13}$/.test(String(value || '').replace(/\s/g, ''));
}

function isPaidApprovedPayment(paymentData = {}) {
    if (paymentData.status !== 'approved') return false;

    const statusDetail = String(paymentData.status_detail || '').toLowerCase();
    if (statusDetail && statusDetail !== 'accredited') return false;

    const transactionAmount = numberOrZero(paymentData.transaction_amount);
    const rawPaidAmount = paymentData.transaction_details?.total_paid_amount;
    const hasPaidAmount = rawPaidAmount !== undefined && rawPaidAmount !== null && rawPaidAmount !== '';
    const paidAmount = numberOrZero(rawPaidAmount);

    return transactionAmount > 0 && (!hasPaidAmount || paidAmount >= transactionAmount);
}

function validateOrderMetadata(metadata = {}, paymentData = {}) {
    const customer = getCustomer(metadata);
    const address = getAddress(metadata);
    const cartItems = parseJsonMetadata(metadata, 'cart_snapshot', []);
    const shippingQuote = parseJsonMetadata(metadata, 'shipping_option_snapshot', null);
    const subtotal = numberOrZero(metadataValue(metadata, 'subtotal', 0));
    const shippingCost = numberOrZero(metadataValue(metadata, 'shipping_cost', 0));
    const total = numberOrZero(metadataValue(metadata, 'total', 0));
    const transactionAmount = numberOrZero(paymentData.transaction_amount);

    if (!String(metadataValue(metadata, 'order_id', '')).startsWith('MP-')) {
        throw new Error('metadata order_id ausente o invalido');
    }
    if (metadataValue(metadata, 'delivery_type', '') !== 'shipping') {
        throw new Error('metadata delivery_type invalido');
    }
    if (!customer.name || customer.name === 'Comprador') {
        throw new Error('metadata customer_name ausente');
    }
    if (!isValidEmail(customer.email)) {
        throw new Error('metadata customer_email invalido');
    }
    if (!isValidPhone(customer.phone)) {
        throw new Error('metadata customer_phone invalido');
    }
    if (!customer.dni || customer.dni === '0') {
        throw new Error('metadata customer_dni ausente');
    }

    normalizeAddress(address);
    const normalizedItems = normalizeCartItems(cartItems);
    validateShippingOption(shippingQuote);

    const calculatedSubtotal = calculateSubtotal(normalizedItems);
    const quoteCost = Math.round(numberOrZero(shippingQuote.shipping_cost || shippingQuote.cost));

    if (subtotal !== calculatedSubtotal) {
        throw new Error('metadata subtotal no coincide con el carrito');
    }
    if (shippingCost !== quoteCost) {
        throw new Error('metadata shipping_cost no coincide con la cotizacion');
    }
    if (total !== subtotal + shippingCost || total !== transactionAmount) {
        throw new Error('metadata total no coincide con Mercado Pago');
    }

    return { customer, address, cartItems: normalizedItems, shippingQuote };
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

function buildNotificationContext({ metadata, shippingRecord = {} }) {
    const customer = getCustomer(metadata);
    const address = getAddress(metadata);
    const rawTrackingNumber = shippingRecord.tracking_number || 'En preparacion';
    const trackingUrl = shippingRecord.tracking_url || '';

    return {
        customer,
        address,
        firstName: escapeHtml(customer.name.split(' ')[0] || customer.name || 'hola'),
        subtotal: formatMoney(metadataValue(metadata, 'subtotal', 0)),
        shippingCost: formatMoney(metadataValue(metadata, 'shipping_cost', 0)),
        total: formatMoney(metadataValue(metadata, 'total', 0)),
        orderId: escapeHtml(metadataValue(metadata, 'order_id', '')),
        rawOrderId: metadataValue(metadata, 'order_id', ''),
        rawTrackingNumber,
        trackingNumber: escapeHtml(rawTrackingNumber),
        trackingUrl,
        trackingText: escapeHtml(trackingUrl || rawTrackingNumber),
        addressLine: escapeHtml(`${address.street} ${address.number}${address.apartment ? ` ${address.apartment}` : ''}, ${address.city}, ${address.province} (CP ${address.postalCode})`)
    };
}

function buildTrackingHtml(context) {
    if (context.trackingUrl) {
        return `<a href="${escapeHtml(context.trackingUrl)}" style="display:inline-block;background:#3a2640;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;margin-top:10px">Ver seguimiento</a>`;
    }

    return `<p style="margin:10px 0 0;color:#6f6174;font-size:14px;line-height:1.5">Estamos preparando el env&iacute;o. Te vamos a avisar cuando el seguimiento est&eacute; disponible.</p>`;
}

function buildSellerEmailHtml(context) {
    const { customer, orderId, addressLine, subtotal, shippingCost, total, trackingText } = context;

    return `
            <div style="margin:0;padding:28px 14px;background:#fcfafc;font-family:Arial,Helvetica,sans-serif;color:#3a2640">
                <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #eadff0;border-radius:24px;overflow:hidden;box-shadow:0 12px 32px rgba(58,38,64,.10)">
                    <div style="background:linear-gradient(135deg,#8fcfed 0%,#d7b5dc 46%,#f1b6c7 100%);padding:28px 30px;color:#ffffff">
                        <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:800">Cecilia Rosso</p>
                        <h1 style="margin:0;font-family:Georgia,serif;font-size:34px;line-height:1.1">Nueva venta aprobada</h1>
                    </div>
                    <div style="padding:28px 30px">
                        <p style="margin:0 0 18px;font-size:16px;line-height:1.6">Se acredit&oacute; una compra del libro y ya se intent&oacute; generar el env&iacute;o.</p>
                        <div style="background:#fcfafc;border:1px solid #eadff0;border-radius:18px;padding:18px;margin-bottom:18px">
                            <p style="margin:0 0 8px"><strong>Pedido:</strong> ${orderId}</p>
                            <p style="margin:0 0 8px"><strong>Comprador:</strong> ${escapeHtml(customer.name)}</p>
                            <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(customer.email)}</p>
                            <p style="margin:0 0 8px"><strong>Tel&eacute;fono:</strong> ${escapeHtml(customer.phone)}</p>
                            <p style="margin:0 0 8px"><strong>DNI:</strong> ${escapeHtml(customer.dni)}</p>
                            <p style="margin:0"><strong>Direcci&oacute;n:</strong> ${addressLine}</p>
                        </div>
                        <div style="background:#fff7fa;border:1px solid #f2d4df;border-radius:18px;padding:18px;margin-bottom:18px">
                            <p style="margin:0 0 8px"><strong>Subtotal:</strong> ${subtotal}</p>
                            <p style="margin:0 0 8px"><strong>Env&iacute;o:</strong> ${shippingCost}</p>
                            <p style="margin:0;font-size:20px"><strong>Total:</strong> ${total}</p>
                        </div>
                        <p style="margin:0"><strong>Seguimiento:</strong> ${trackingText}</p>
                    </div>
                </div>
            </div>
        `;
}

function buildCustomerEmailHtml(context) {
    const { firstName, orderId, total, addressLine, trackingNumber } = context;
    const trackingHtml = buildTrackingHtml(context);

    return `
                <div style="margin:0;padding:28px 14px;background:#fcfafc;font-family:Arial,Helvetica,sans-serif;color:#3a2640">
                    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #eadff0;border-radius:24px;overflow:hidden;box-shadow:0 12px 32px rgba(58,38,64,.10)">
                        <div style="background:linear-gradient(135deg,#8fcfed 0%,#d7b5dc 46%,#f1b6c7 100%);padding:34px 30px;color:#ffffff;text-align:center">
                            <p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:800">Cecilia Rosso</p>
                            <h1 style="margin:0;font-family:Georgia,serif;font-size:36px;line-height:1.1">Gracias por tu compra</h1>
                        </div>
                        <div style="padding:30px">
                            <p style="margin:0 0 16px;font-size:18px;line-height:1.6">Hola ${firstName}, recibimos tu pago y tu ejemplar de <strong>Comunicar para vivir m&aacute;s livianos</strong> ya qued&oacute; registrado.</p>
                            <div style="background:#fcfafc;border:1px solid #eadff0;border-radius:18px;padding:20px;margin:22px 0">
                                <p style="margin:0 0 8px;color:#8b7194;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px">Pedido</p>
                                <p style="margin:0 0 8px"><strong>N&uacute;mero:</strong> ${orderId}</p>
                                <p style="margin:0 0 8px"><strong>Total abonado:</strong> ${total}</p>
                                <p style="margin:0"><strong>Direcci&oacute;n de entrega:</strong> ${addressLine}</p>
                            </div>
                            <div style="background:#fff7fa;border:1px solid #f2d4df;border-radius:18px;padding:20px;margin:22px 0">
                                <p style="margin:0 0 8px;color:#8b7194;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px">Seguimiento</p>
                                <p style="margin:0;font-size:17px"><strong>C&oacute;digo:</strong> ${trackingNumber}</p>
                                ${trackingHtml}
                            </div>
                            <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#6f6174">El env&iacute;o se realiza a domicilio. Si el correo todav&iacute;a no muestra movimientos, espera unas horas hasta que se actualice el sistema log&iacute;stico.</p>
                            <p style="margin:0;font-size:15px;line-height:1.6;color:#6f6174">Ante cualquier duda, responde este correo y te ayudamos con el pedido.</p>
                            <p style="margin:26px 0 0;font-family:Georgia,serif;font-size:24px;color:#e8a9c0;font-style:italic">Con cari&ntilde;o, Ceci</p>
                        </div>
                    </div>
                </div>
            `;
}

function buildWhatsAppText({ metadata, shippingRecord = {} }) {
    const customer = getCustomer(metadata);
    const address = getAddress(metadata);
    const total = formatMoney(metadataValue(metadata, 'total', 0));
    const orderId = metadataValue(metadata, 'order_id', '-');
    const trackingNumber = shippingRecord.tracking_number || 'En preparacion';
    const trackingUrl = shippingRecord.tracking_url || '';
    const apartment = address.apartment ? ` ${address.apartment}` : '';
    const trackingLine = trackingUrl ? `\n🔗 Link: ${trackingUrl}` : '';

    return `🟢 Compra realizada

📚 Producto: Comunicar para vivir mas livianos
👤 Nombre: ${customer.name}
🪪 DNI: ${customer.dni}
📧 Email: ${customer.email}
📱 Telefono: ${customer.phone}

📍 Ubicacion:
${address.street} ${address.number}${apartment}
${address.city}, ${address.province}
CP ${address.postalCode}

💳 Total: ${total}
🚚 Envio: domicilio
🔎 Seguimiento: ${trackingNumber}${trackingLine}
🧾 Pedido: ${orderId}`;
}

function buildNotificationPreviews({ metadata, shippingRecord = {} }) {
    const context = buildNotificationContext({ metadata, shippingRecord });

    return {
        sellerEmailHtml: buildSellerEmailHtml(context),
        customerEmailHtml: buildCustomerEmailHtml(context),
        whatsAppText: buildWhatsAppText({ metadata, shippingRecord })
    };
}

function getSellerRecipients(sellerEmail) {
    const recipients = [
        { email: sellerEmail, name: 'Cecilia Rosso' },
        { email: 'snvillamonte@gmail.com', name: 'Santiago Villamonte' }
    ];
    const seen = new Set();

    return recipients.filter(recipient => {
        const email = String(recipient.email || '').trim().toLowerCase();
        if (!email || seen.has(email)) return false;
        seen.add(email);
        return true;
    });
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
    const previews = buildNotificationPreviews({ metadata, shippingRecord });
    const headers = {
        'Accept': 'application/json',
        'api-key': brevoKey
    };

    await postJson('https://api.brevo.com/v3/smtp/email', {
        sender: { name: 'Sistema Tienda', email: sellerEmail },
        to: getSellerRecipients(sellerEmail),
        subject: 'Nueva venta aprobada - Libro',
        htmlContent: previews.sellerEmailHtml
    }, headers);

    if (customer.email && customer.email !== 'nodata@example.com') {
        await postJson('https://api.brevo.com/v3/smtp/email', {
            sender: { name: 'Cecilia Karina Rosso', email: sellerEmail },
            to: [{ email: customer.email, name: customer.name }],
            subject: 'Recibimos tu pago',
            htmlContent: previews.customerEmailHtml
        }, headers);
    }
}

async function sendWhatsApp(metadata, shippingRecord = {}) {
    const phone = (process.env.CALLMEBOT_PHONE || '').trim();
    const apiKey = (process.env.CALLMEBOT_API_KEY || '').trim();
    if (!phone || !apiKey) return;

    const text = buildWhatsAppText({ metadata, shippingRecord });
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

exports.buildNotificationPreviews = buildNotificationPreviews;
exports.buildWhatsAppText = buildWhatsAppText;

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

        const { MercadoPagoConfig, Payment } = require('mercadopago');
        const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
        const paymentClient = new Payment(client);
        const paymentData = await paymentClient.get({ id: paymentId });
        const metadata = paymentData.metadata || {};
        let shipmentRecord = {};
        let zipnovaError = '';

        if (isPaidApprovedPayment(paymentData)) {
            let orderData;
            try {
                orderData = validateOrderMetadata(metadata, paymentData);
            } catch (error) {
                console.warn(`Webhook aprobado ignorado: ${error.message || error}. Payment ID: ${paymentId}`);
                return { statusCode: 200, body: 'Orden aprobada ignorada por metadata invalida' };
            }

            try {
                shipmentRecord = normalizeShipmentResult(await shippingProviderService.createShipment({
                    paymentId,
                    customer: orderData.customer,
                    address: orderData.address,
                    cartItems: orderData.cartItems,
                    declaredValue: numberOrZero(metadataValue(metadata, 'subtotal', paymentData.transaction_amount || 0)),
                    shippingQuote: orderData.shippingQuote
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
                await sendWhatsApp(metadata, shipmentRecord);
            } catch (error) {
                console.error('Error enviando WhatsApp:', error.message || error);
            }
        } else if (paymentData.status === 'approved') {
            console.warn(`Webhook aprobado ignorado: pago no acreditado de forma valida. Payment ID: ${paymentId}, status_detail: ${paymentData.status_detail || 'sin detalle'}`);
            return { statusCode: 200, body: 'Pago aprobado no acreditado ignorado' };
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
