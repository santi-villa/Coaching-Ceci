const { verifySharedSecret, escapeHtml } = require('./lib/webhook-auth');
const { button, infoCard, paragraph, renderEmail } = require('./lib/email-layout');

// Mail al comprador cada vez que el correo informa un movimiento del paquete.
function buildTrackingUpdateEmail({ trackingCode, status }) {
    const statusText = String(status || 'Cambio de estado').trim();
    const lower = statusText.toLowerCase();
    const delivered = lower.includes('entregad') || lower.includes('delivered');
    const trackingUrl = `https://www.zipnova.com/rastreo?tracking=${encodeURIComponent(trackingCode)}`;
    const prettyStatus = escapeHtml(statusText.charAt(0).toUpperCase() + statusText.slice(1));

    return renderEmail({
        preheader: `Estado de tu envío: ${statusText}`,
        eyebrow: 'Novedades de tu envío',
        title: delivered ? '¡Tu libro llegó!' : 'Tu libro está en camino',
        bodyHtml: [
            paragraph(delivered
                ? 'El correo nos avisa que tu paquete ya fue entregado. ¡Que disfrutes la lectura!'
                : 'El correo nos acaba de informar un movimiento en tu paquete.'),
            infoCard('', [
                ['Estado', prettyStatus],
                ['Código de seguimiento', escapeHtml(trackingCode)]
            ], { tone: 'teal' }),
            button(trackingUrl, delivered ? 'Ver detalle del envío' : 'Seguir mi envío'),
            paragraph('Si tenés alguna duda con la entrega, respondé este mail y te ayudamos.', { muted: true, size: 14 })
        ].join('')
    });
}

exports.buildTrackingUpdateEmail = buildTrackingUpdateEmail;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Este endpoint manda mails a terceros: sin secreto configurado o con uno incorrecto, no hace nada.
    const webhookSecret = (process.env.ZIPPIN_WEBHOOK_SECRET || '').trim();
    if (!webhookSecret) {
        console.error('ZIPPIN_WEBHOOK_SECRET no configurado: webhook deshabilitado.');
        return { statusCode: 503, body: 'Webhook no configurado' };
    }
    if (!verifySharedSecret(event, webhookSecret)) {
        console.warn('Webhook Zippin rechazado: secreto invalido.');
        return { statusCode: 401, body: 'No autorizado' };
    }

    try {
        const body = JSON.parse(event.body);
        console.log("🚚 Webhook ZIPPIN Update recibido. Tracking:", body.tracking_code || body.shipment?.tracking_code || 'sin tracking');

        // El 'topic' de Zippin para seguimientos se llama "status" o viene implícito.
        // Asume un payload con `tracking_code`, `status` o `status_name`
        const trackingCode = body.tracking_code || body.shipment?.tracking_code;
        const estadoGral = body.status_name || body.status || "Cambio de Estado";
        
        // Intentar obtener el email del comprador en distintas posibles estructuras de Zippin
        const emailComprador = (body.buyer && body.buyer.email) || 
                               (body.destination && body.destination.email) || 
                               (body.shipment && body.shipment.destination && body.shipment.destination.email) || 
                               null;

        const estadoMinuscula = estadoGral.toLowerCase();

        // Si es un estado de cancelación, no enviamos correo para no confundir o spamear
        if (estadoMinuscula.includes('cancel') || estadoMinuscula.includes('anulad')) {
            console.log("🚫 Envío cancelado/anulado, ignorando email.");
            return { statusCode: 200, body: JSON.stringify({ message: 'Tracking ignorado por cancelacion' }) };
        }

        if (!trackingCode) {
            console.log("⚠️ No se encontró tracking_code en el webhook, ignorando.");
            return { statusCode: 200, body: JSON.stringify({ message: 'Sin tracking code' }) };
        }

        if (process.env.BREVO_API_KEY) {
            const sellerEmail = process.env.SELLER_EMAIL || "rossoceci@gmail.com";

            // Solo enviamos correo si tenemos el email del cliente.
            // Si no lo tenemos, NO enviamos a la vendedora para evitar spamearla con cada movimiento del correo.
            if (emailComprador && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailComprador)) {
                const destinatarioObj = { email: emailComprador, name: "Cliente" };

                const brevoPayload = {
                    sender: { name: "Cecilia Rosso", email: sellerEmail },
                    to: [destinatarioObj],
                    subject: `Novedades de tu envío: ${String(estadoGral).slice(0, 60)}`,
                    htmlContent: buildTrackingUpdateEmail({ trackingCode: String(trackingCode), status: estadoGral })
                };

                await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "api-key": process.env.BREVO_API_KEY
                    },
                    body: JSON.stringify(brevoPayload)
                });
                console.log(`✅ Email de tracking disparado al cliente (${emailComprador}) al estado: ${estadoGral}`);
            } else {
                console.log(`ℹ️ Email omitido: no hay correo del comprador en el webhook. Tracking: ${trackingCode}, Estado: ${estadoGral}`);
            }
        }

        // Siempre devolver 200 rápido para que Zippin sepa que lo procesamos bien y no nos haga re-intentos
        return { statusCode: 200, body: JSON.stringify({ message: 'Tracking Recibido' }) };
    } catch (error) {
        console.error("❌ Error recibiendo tracking de Zippin:", error);
        return { statusCode: 200, body: 'Exito ignorando el error para no trabar Zippin' }; // Fallback
    }
};
