exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        console.log("🚚 Webhook ZIPPIN Update:", JSON.stringify(body));

        // El 'topic' de Zippin para seguimientos se llama "status" o viene implícito.
        // Asume un payload con `tracking_code`, `status` o `status_name`
        const trackingCode = body.tracking_code || "Desconocido";
        const estadoGral = body.status_name || body.status || "Cambio de Estado";
        const emailComprador = body.buyer ? body.buyer.email : null; // Si la API devuelve los datos que le dimos originales.

        if (process.env.BREVO_API_KEY) {
            const sellerEmail = process.env.SELLER_EMAIL || "tu-correo@gmail.com";

            // Si vino el correo del cliente, le avisamos a él. Sino, nos avisamos a nosotros para llevar el control.
            const destinatarioObj = emailComprador 
                ? { email: emailComprador, name: "Cliente VIP" } 
                : { email: sellerEmail, name: "Control de Envíos internos" };

            const brevoPayload = {
                sender: { name: "Actualización Logística Zippin", email: sellerEmail },
                to: [destinatarioObj],
                subject: `Novedad de tu envío #${trackingCode} - [${estadoGral}]`,
                htmlContent: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
                        <h1 style="color: #b59ad6; text-align: center;">¡Tenemos novedades sobre el envío de tu libro!</h1>
                        <p style="text-align: center;">El correo nos acaba de informar un movimiento en tu paquete.</p>
                        
                        <div style="background-color: #fcfafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #b59ad6; text-align: center;">
                            <h3 style="margin-top: 0; color: #3a2640; font-size: 24px;">ESTADO: ${estadoGral.toUpperCase()}</h3>
                            <p style="font-size: 16px;"><strong>Tu código de seguimiento localizador:</strong> <br>${trackingCode}</p>
                            <br>
                            <a href="https://api.zippin.com.ar/v1/shipments/${trackingCode}" style="padding: 10px 20px; background-color: #3a2640; color: white; text-decoration: none; border-radius: 5px;">Rastrear en la web oficial</a>
                        </div>
                        <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #999;">Esta es una notificación inteligente autogenerada.</p>
                    </div>
                `
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
            console.log(`Email de tracking disparado al estado: ${estadoGral}`);
        }

        // Siempre devolver 200 rápido para que Zippin sepa que lo procesamos bien y no nos haga re-intentos
        return { statusCode: 200, body: JSON.stringify({ message: 'Tracking Recibido' }) };
    } catch (error) {
        console.error("Error recibiendo tracking de Zippin:", error);
        return { statusCode: 200, body: 'Exito ignorando el error para no trabar Zippin' }; // Fallback
    }
};
