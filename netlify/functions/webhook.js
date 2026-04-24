const { MercadoPagoConfig, Payment } = require('mercadopago');

exports.handler = async (event) => {
    // MP espera recibir un status 200 / 201 muy rápido.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const body = JSON.parse(event.body);
        console.log("🔥 Webhook MP Recibido:", JSON.stringify(body));

        // Solo nos importan notificaciones de tipo "pago", acción de creación o update
        if (body.type === 'payment' && (body.action === 'payment.created' || body.action === 'payment.updated')) {
            const paymentId = body.data.id;
            
            // 1. Inicialización de Mercado Pago
            const mpAccessToken = (process.env.MP_ACCESS_TOKEN || "").trim();
            if (!mpAccessToken) {
                console.error("❌ Error: MP_ACCESS_TOKEN no configurado.");
                return { statusCode: 200, body: 'Token no configurado' };
            }

            const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
            const paymentClient = new Payment(client);
            
            const paymentData = await paymentClient.get({ id: paymentId });
            console.log("Estado real del pago:", paymentData.status);

            // Si el pago está aprobado (tarjeta pasó bien o dinero en cuenta)
            if (paymentData.status === 'approved') {
                const metadata = paymentData.metadata || {};
                console.log("Metadata recuperada:", JSON.stringify(metadata));
                
                let logisticaTrackingUrl = "Pronto recibirás el link oficial del correo.";
                
                // === 1. INTEGRACIÓN LOGÍSTICA (ZIPPIN) ===
                // Mantenemos la lógica de Zippin igual pero con protección de metadata
                if (metadata.delivery_type === 'shipping') {
                    const zippinKey = (process.env.ZIPPIN_API_KEY || "").trim();
                    const zippinSecret = (process.env.ZIPPIN_API_SECRET || "").trim();
                    
                    if (zippinKey && zippinSecret) {
                        try {
                            console.log("Acá iría la creación de remito en ZIPPIN");
                            // (Lógica de Zippin comentada según original)
                        } catch (err) {
                            console.error("Error conectando con ZIPPIN:", err);
                        }
                    } else {
                        console.log("Aviso: Faltan credenciales ZIPPIN para crear remitos automáticos.");
                    }
                }
                
                // === 2. ENVÍO DE CORREOS VÍA BREVO ===
                const brevoKey = (process.env.BREVO_API_KEY || "").trim();
                const sellerEmail = (process.env.SELLER_EMAIL || "rossoceci@gmail.com").trim();
                
                if (brevoKey) {
                    console.log(`Iniciando envío de correos. Remitente: ${sellerEmail}`);
                    
                    // A) Correo interno para TI (la vendedora)
                    const brevoPayloadVendedora = {
                        sender: { name: "Sistema Tienda", email: sellerEmail }, 
                        to: [{ email: sellerEmail, name: "Cecilia Rosso" }],
                        subject: `✅ ¡Nueva Venta! Libro pagado y listo para despacho`,
                        htmlContent: `
                            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
                                <h1 style="color: #b59ad6; text-align: center;">¡Tenes una nueva compra!</h1>
                                <p style="text-align: center;">El pago fue aprobado exitosamente por Mercado Pago.</p>
                                
                                <div style="background-color: #fcfafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #b59ad6;">
                                    <h3 style="margin-top: 0; color: #3a2640;">Datos del comprador</h3>
                                    <p><strong>Nombre:</strong> ${metadata.customer_name || 'Vacio'}</p>
                                    <p><strong>DNI:</strong> ${metadata.customer_dni || 'Vacio'}</p>
                                    <p><strong>Teléfono:</strong> ${metadata.customer_phone || 'Vacio'}</p>
                                    <p><strong>Email:</strong> ${metadata.customer_email || 'Vacio'}</p>
                                    
                                    <h3 style="margin-top: 20px; color: #3a2640;">Datos de entrega</h3>
                                    <p><strong>Tipo:</strong> ${metadata.delivery_type === 'pickup' ? 'Retiro en persona' : 'Envio a Domicilio'}</p>
                                    ${metadata.delivery_type === 'shipping' ? `
                                        <p><strong>Dirección:</strong> ${metadata.address || ''}, ${metadata.city || ''}, ${metadata.province || ''} (CP: ${metadata.zip || ''})</p>
                                    ` : ''}
                                </div>
                                <hr style="border: none; border-top: 1px solid #eee;">
                                <p style="text-align: center; margin-top: 20px;">
                                    <a href="https://wa.me/549${(metadata.customer_phone || '').replace(/\D/g,'')}" style="display:inline-block; padding: 12px 25px; background-color: #25D366; color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">Contactar por WhatsApp al cliente</a>
                                </p>
                            </div>
                        `
                    };

                    try {
                        const resVendor = await fetch("https://api.brevo.com/v3/smtp/email", {
                            method: "POST",
                            headers: { 
                                "Accept": "application/json", 
                                "Content-Type": "application/json", 
                                "api-key": brevoKey 
                            },
                            body: JSON.stringify(brevoPayloadVendedora)
                        });

                        if (!resVendor.ok) {
                            const errorData = await resVendor.json();
                            console.error("❌ Error Brevo (Vendedora):", JSON.stringify(errorData));
                            throw new Error(`Error Brevo Vendedor: ${resVendor.status} - ${JSON.stringify(errorData)}`);
                        }
                        console.log("✅ Email a vendedora enviado.");

                        // B) Correo automático PARA EL CLIENTE
                        if (metadata.customer_email && metadata.customer_email !== 'Vacio') {
                            const textEnvio = metadata.delivery_type === 'shipping' 
                                ? `<p>Estamos preparando tu libro de manera física. Una vez despachado en el correo, recibirás el código de seguimiento. Enlace general de seguimiento online (asignado): ${logisticaTrackingUrl}</p>`
                                : `<p>Has seleccionado "Retiro en persona". Por favor, envíanos un mensajito para coordinar por dónde vas a pasar a buscarlo!</p>`;
                                
                            const brevoPayloadCliente = {
                                sender: { name: "Cecilia Karina Rosso", email: sellerEmail }, 
                                to: [{ email: metadata.customer_email, name: metadata.customer_name || 'Cliente' }],
                                subject: `Recibimos tu pago 🤍 ¡Gracias por tu compra!`,
                                htmlContent: `
                                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
                                        <h1 style="color: #b59ad6; text-align: center;">¡Gracias por sumarte, ${(metadata.customer_name || 'estimado/a').split(' ')[0]}!</h1>
                                        <p style="text-align: center; font-size: 16px;">Confirmamos que tu pago por "Comunicar para vivir más livianos" ingresó correctamente.</p>
                                        
                                        <div style="background-color: #fcfafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #b59ad6;">
                                            <h3 style="margin-top: 0; color: #3a2640;">Próximos pasos</h3>
                                            ${textEnvio}
                                        </div>
                                        <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #888;">Cualquier duda, podés responder a este mismo correo o hablarnos en @ceciliarosso.coach</p>
                                    </div>
                                `
                            };

                            const resClient = await fetch("https://api.brevo.com/v3/smtp/email", {
                                method: "POST",
                                headers: { 
                                    "Accept": "application/json", 
                                    "Content-Type": "application/json", 
                                    "api-key": brevoKey 
                                },
                                body: JSON.stringify(brevoPayloadCliente)
                            });

                            if (!resClient.ok) {
                                const errorData = await resClient.json();
                                console.error("❌ Error Brevo (Cliente):", JSON.stringify(errorData));
                                throw new Error(`Error Brevo Cliente: ${resClient.status} - ${JSON.stringify(errorData)}`);
                            }
                            console.log("✅ Email a comprador enviado exitosamente.");
                        }
                    } catch (emailError) {
                        console.error("🔥 Fallo crítico en el envío de emails:", emailError.message);
                        // No retornamos 500 aquí si queremos que MP deje de reintentar en errores permanentes,
                        // pero por ahora lanzamos error para que quede el registro en logs.
                        throw emailError;
                    }
                } else {
                    console.log("⚠️ No se envía correo porque falta la variable BREVO_API_KEY o está vacía.");
                }
            }
        }

        return { statusCode: 200, body: 'OK' }; // Siempre devolver 200 rápido a MP si el formato fue correcto
    } catch (error) {
        console.error("🔥 Error interno procesando webhook:", error);
        return { statusCode: 500, body: 'Error interno' };
    }
};
