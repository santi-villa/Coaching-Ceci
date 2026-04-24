const crypto = require('node:crypto');
const { connectLambda, getStore } = require('@netlify/blobs');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const IDEMPOTENCY_STORE_NAME = 'processed-payments';
const PROCESSING_LOCK_TTL_MS = 15 * 60 * 1000;

function getHeader(event, name) {
    const headers = event.headers || {};
    const headerKey = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
    return headerKey ? headers[headerKey] : '';
}

function parseJsonBody(body) {
    try {
        return JSON.parse(body || '{}');
    } catch (error) {
        throw new Error('INVALID_JSON');
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function sanitizeMetadata(metadata) {
    return {
        customer_name: normalizeText(metadata?.customer_name),
        customer_phone: normalizeText(metadata?.customer_phone),
        customer_email: normalizeText(metadata?.customer_email).toLowerCase(),
        customer_dni: normalizeText(metadata?.customer_dni),
        delivery_type: normalizeText(metadata?.delivery_type),
        address: normalizeText(metadata?.address),
        city: normalizeText(metadata?.city),
        zip: normalizeText(metadata?.zip),
        province: normalizeText(metadata?.province),
    };
}

function parseSignatureHeader(signatureHeader) {
    const parsed = { ts: '', v1: '' };

    for (const fragment of String(signatureHeader || '').split(',')) {
        const [rawKey, rawValue] = fragment.split('=');
        const key = rawKey?.trim();
        const value = rawValue?.trim();

        if (key === 'ts') parsed.ts = value || '';
        if (key === 'v1') parsed.v1 = value || '';
    }

    return parsed;
}

function buildManifest(event, body, ts, requestId) {
    const queryParams = event.queryStringParameters || {};
    const queryDataId = queryParams['data.id'];
    const bodyDataId = body?.data?.id;
    const dataId = String(queryDataId || bodyDataId || '').toLowerCase();

    let manifest = '';
    if (dataId) manifest += `id:${dataId};`;
    if (requestId) manifest += `request-id:${requestId};`;
    if (ts) manifest += `ts:${ts};`;

    return manifest;
}

function secureCompare(left, right) {
    if (!left || !right) {
        return false;
    }

    const leftBuffer = Buffer.from(left, 'utf8');
    const rightBuffer = Buffer.from(right, 'utf8');

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function validateMercadoPagoSignature(event, body) {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('MISSING_MP_WEBHOOK_SECRET');
    }

    const signatureHeader = getHeader(event, 'x-signature');
    const requestId = getHeader(event, 'x-request-id');
    const { ts, v1 } = parseSignatureHeader(signatureHeader);

    if (!signatureHeader || !requestId || !ts || !v1) {
        throw new Error('INVALID_SIGNATURE_HEADERS');
    }

    const manifest = buildManifest(event, body, ts, requestId);
    if (!manifest) {
        throw new Error('INVALID_SIGNATURE_MANIFEST');
    }

    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

    if (!secureCompare(generatedSignature, v1)) {
        throw new Error('INVALID_SIGNATURE');
    }

    return { requestId, ts };
}

async function acquirePaymentLock(event, paymentId, requestId) {
    connectLambda(event);
    const store = getStore(IDEMPOTENCY_STORE_NAME);
    const key = `payments/${paymentId}.json`;
    const nowIso = new Date().toISOString();

    const createAttempt = await store.setJSON(key, {
        status: 'processing',
        requestId,
        updatedAt: nowIso,
    }, {
        onlyIfNew: true,
    });

    if (createAttempt.modified) {
        return { store, key, canProcess: true };
    }

    const existingEntry = await store.get(key, { type: 'json' });
    if (existingEntry?.status === 'completed') {
        return { store, key, canProcess: false, reason: 'already_completed' };
    }

    const existingUpdatedAt = Date.parse(existingEntry?.updatedAt || '');
    const isFreshLock = Number.isFinite(existingUpdatedAt) && (Date.now() - existingUpdatedAt) < PROCESSING_LOCK_TTL_MS;
    if (existingEntry?.status === 'processing' && isFreshLock) {
        return { store, key, canProcess: false, reason: 'in_progress' };
    }

    await store.setJSON(key, {
        status: 'processing',
        requestId,
        updatedAt: nowIso,
    });

    return { store, key, canProcess: true };
}

async function storePaymentState(store, key, paymentId, status, extra = {}) {
    await store.setJSON(key, {
        status,
        paymentId,
        updatedAt: new Date().toISOString(),
        ...extra,
    });
}

function buildVendorEmailHtml(metadata) {
    const name = escapeHtml(metadata.customer_name);
    const dni = escapeHtml(metadata.customer_dni);
    const phone = escapeHtml(metadata.customer_phone);
    const email = escapeHtml(metadata.customer_email);
    const deliveryType = metadata.delivery_type === 'pickup' ? 'Retiro en persona' : 'Envio a domicilio';
    const addressLine = metadata.delivery_type === 'shipping'
        ? `<p><strong>Direccion:</strong> ${escapeHtml(metadata.address)}, ${escapeHtml(metadata.city)}, ${escapeHtml(metadata.province)} (CP: ${escapeHtml(metadata.zip)})</p>`
        : '';
    const whatsappPhone = metadata.customer_phone.replace(/\D/g, '');
    const whatsappHref = whatsappPhone ? `https://wa.me/549${escapeHtml(whatsappPhone)}` : '';
    const whatsappButton = whatsappHref
        ? `<p style="text-align: center; margin-top: 20px;">
                <a href="${whatsappHref}" style="display:inline-block; padding: 12px 25px; background-color: #25D366; color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">Contactar por WhatsApp al cliente</a>
           </p>`
        : '';

    return `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
            <h1 style="color: #b59ad6; text-align: center;">Tenes una nueva compra</h1>
            <p style="text-align: center;">El pago fue aprobado exitosamente por Mercado Pago.</p>
            <div style="background-color: #fcfafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #b59ad6;">
                <h3 style="margin-top: 0; color: #3a2640;">Datos del comprador</h3>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>DNI:</strong> ${dni}</p>
                <p><strong>Telefono:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <h3 style="margin-top: 20px; color: #3a2640;">Datos de entrega</h3>
                <p><strong>Tipo:</strong> ${escapeHtml(deliveryType)}</p>
                ${addressLine}
            </div>
            <hr style="border: none; border-top: 1px solid #eee;">
            ${whatsappButton}
        </div>
    `;
}

function buildCustomerEmailHtml(metadata, trackingUrl) {
    const firstName = escapeHtml(metadata.customer_name.split(' ')[0] || 'Gracias');
    const shippingMessage = metadata.delivery_type === 'shipping'
        ? `<p>Estamos preparando tu libro de manera fisica. Una vez despachado en el correo, recibiras el codigo de seguimiento. Enlace general de seguimiento online: ${escapeHtml(trackingUrl)}</p>`
        : `<p>Has seleccionado "Retiro en persona". En breve nos pondremos en contacto para coordinar la entrega.</p>`;

    return `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
            <h1 style="color: #b59ad6; text-align: center;">Gracias por sumarte, ${firstName}</h1>
            <p style="text-align: center; font-size: 16px;">Confirmamos que tu pago por "Comunicar para vivir mas livianos" ingreso correctamente.</p>
            <div style="background-color: #fcfafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #b59ad6;">
                <h3 style="margin-top: 0; color: #3a2640;">Proximos pasos</h3>
                ${shippingMessage}
            </div>
            <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #888;">Cualquier duda, podes responder a este mismo correo o escribirnos por Instagram a @ceciliarosso.coach.</p>
        </div>
    `;
}

async function sendBrevoEmail(payload) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`BREVO_API_ERROR_${response.status}:${responseText}`);
    }
}

async function sendNotificationEmails(metadata, trackingUrl) {
    if (!process.env.BREVO_API_KEY) {
        console.log('Webhook email skipped', { reason: 'missing_brevo_api_key' });
        return;
    }

    const sellerEmail = process.env.SELLER_EMAIL || 'tu-correo-real@gmail.com';

    await sendBrevoEmail({
        sender: { name: 'Sistema Tienda', email: sellerEmail },
        to: [{ email: sellerEmail, name: 'Cecilia Rosso' }],
        subject: 'Nueva venta aprobada del libro',
        htmlContent: buildVendorEmailHtml(metadata),
    });

    if (metadata.customer_email && metadata.customer_email !== 'vacio') {
        await sendBrevoEmail({
            sender: { name: 'Cecilia Karina Rosso', email: sellerEmail },
            to: [{ email: metadata.customer_email, name: metadata.customer_name || 'Cliente' }],
            subject: 'Recibimos tu pago - Gracias por tu compra',
            htmlContent: buildCustomerEmailHtml(metadata, trackingUrl),
        });
    }
}

async function maybeCreateShipping(metadata) {
    let trackingUrl = 'Pronto recibirás el link oficial del correo.';

    if (metadata.delivery_type !== 'shipping') {
        return trackingUrl;
    }

    if (!process.env.ZIPPIN_API_KEY || !process.env.ZIPPIN_API_SECRET) {
        console.log('Shipping automation skipped', { reason: 'missing_zippin_credentials' });
        return trackingUrl;
    }

    try {
        const authString = Buffer.from(
            `${process.env.ZIPPIN_API_KEY}:${process.env.ZIPPIN_API_SECRET}`
        ).toString('base64');

        console.log('Shipping automation placeholder executed', {
            zip: metadata.zip,
            deliveryType: metadata.delivery_type,
            authConfigured: Boolean(authString),
        });
    } catch (error) {
        console.error('Shipping automation failed', {
            message: error.message,
            deliveryType: metadata.delivery_type,
        });
        throw new Error('ZIPPIN_SHIPMENT_CREATION_FAILED');
    }

    return trackingUrl;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let paymentLock;
    let paymentId = '';

    try {
        const body = parseJsonBody(event.body);
        const signatureInfo = validateMercadoPagoSignature(event, body);

        paymentId = String(body?.data?.id || '');

        console.log('Mercado Pago webhook received', {
            type: body?.type || 'unknown',
            action: body?.action || 'unknown',
            paymentId,
            requestId: signatureInfo.requestId,
            retry: getHeader(event, 'x-retry') || '0',
        });

        if (body.type !== 'payment' || !['payment.created', 'payment.updated'].includes(body.action)) {
            return { statusCode: 200, body: 'Ignored topic' };
        }

        if (!paymentId) {
            throw new Error('MISSING_PAYMENT_ID');
        }

        paymentLock = await acquirePaymentLock(event, paymentId, signatureInfo.requestId);
        if (!paymentLock.canProcess) {
            console.log('Webhook skipped by idempotency control', {
                paymentId,
                reason: paymentLock.reason,
            });
            return { statusCode: 200, body: 'Already processed' };
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const paymentClient = new Payment(client);
        const paymentData = await paymentClient.get({ id: paymentId });

        console.log('Mercado Pago payment fetched', {
            paymentId,
            status: paymentData.status,
            statusDetail: paymentData.status_detail || 'unknown',
        });

        if (paymentData.status !== 'approved') {
            await storePaymentState(paymentLock.store, paymentLock.key, paymentId, 'pending', {
                paymentStatus: paymentData.status,
            });
            return { statusCode: 200, body: 'Payment not approved yet' };
        }

        const metadata = sanitizeMetadata(paymentData.metadata);
        const trackingUrl = await maybeCreateShipping(metadata);
        await sendNotificationEmails(metadata, trackingUrl);
        await storePaymentState(paymentLock.store, paymentLock.key, paymentId, 'completed', {
            paymentStatus: paymentData.status,
        });

        console.log('Webhook processed successfully', {
            paymentId,
            deliveryType: metadata.delivery_type || 'unknown',
            emailSentToCustomer: Boolean(metadata.customer_email && metadata.customer_email !== 'vacio'),
        });

        return { statusCode: 200, body: 'OK' };
    } catch (error) {
        if (paymentLock?.store && paymentLock?.key && paymentId) {
            await storePaymentState(paymentLock.store, paymentLock.key, paymentId, 'failed', {
                error: error?.message || 'UNKNOWN_ERROR',
            });
        }

        const isValidationError = [
            'INVALID_JSON',
            'MISSING_MP_WEBHOOK_SECRET',
            'INVALID_SIGNATURE_HEADERS',
            'INVALID_SIGNATURE_MANIFEST',
            'INVALID_SIGNATURE',
            'MISSING_PAYMENT_ID',
        ].includes(error.message);

        console.error('Error processing Mercado Pago webhook', {
            paymentId: paymentId || 'unknown',
            message: error.message || 'UNKNOWN_ERROR',
        });

        return {
            statusCode: isValidationError ? 401 : 500,
            body: isValidationError ? 'Invalid webhook' : 'Internal error',
        };
    }
};
