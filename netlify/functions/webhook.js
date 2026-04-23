const { MercadoPagoConfig, Payment } = require('mercadopago');

exports.handler = async (event) => {
    // MP espera recibir un status 200 / 201 muy rápido.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const body = JSON.parse(event.body);
        console.log("🔥 Webhook MP:", JSON.stringify(body));

        // Solo nos importan notificaciones de tipo "pago", acción de creación o update
        if (body.type === 'payment' && (body.action === 'payment.created' || body.action === 'payment.updated')) {
            const paymentId = body.data.id;
            
            // Consultamos la API oficial de Mercado Pago para ver si este ID es real
            // y para extraer la metadata que agregamos en checkout.js
            const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
            const paymentClient = new Payment(client);
            
            const paymentData = await paymentClient.get({ id: paymentId });
            console.log("Estado real del pago:", paymentData.status);

            // Si el pago está aprobado (tarjeta pasó bien o dinero en cuenta)
            if (paymentData.status === 'approved') {
                const metadata = paymentData.metadata;
                
                let logisticaTrackingUrl = "Pronto recibirás el link oficial del correo.";
                
                // === 1. INTEGRACIÓN LOGÍSTICA (ZIPPIN) ===
                if (metadata.delivery_type === 'shipping') {
                    if (process.env.ZIPPIN_API_KEY && process.env.ZIPPIN_API_SECRET) {
                        try {
                            const authString = Buffer.from(process.env.ZIPPIN_API_KEY + ':' + process.env.ZIPPIN_API_SECRET).toString('base64');
                            
                            /* ESPACIO RESERVADO PARA API DE ZIPPIN - Creación de Envío
                            // Reemplazar la data dura con la que devuelva /v1/quotes o las medidas oficiales de Zippin
                            const req = await fetch('https://api.zippin.com.ar/v1/shipments', { 
                                method: 'POST',
                                headers: { 
                                    'Authorization': 'Basic ' + authString,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    buyer: { 
                                        full_name: metadata.customer_name, 
                                        email: metadata.customer_email,
                                        document: metadata.customer_dni,
                                        phone: metadata.customer_phone
                                    },
                                    destination: {
                                        street: metadata.address,
                                        zip_code: metadata.zip,
                                        city: metadata.city,
                                        state: metadata.province
                                    },
                                    origin: { zip_code: "1181" },
                                    parcels: [{ length: 20, width: 15, height: 5, weight: 500 }]
                                })
                            });
                            const res = await req.json();
                            logisticaTrackingUrl = res.tracking_url || 'https://zippin.com.ar/tracking/' + res.tracking_code; 
                            */
                            console.log("Acá iría la creación de remito en ZIPPIN");
                        } catch (err) {
                            console.error("Error conectando con ZIPPIN para crear envío:", err);
                            throw new Error("No se pudo crear el envío en Zippin, forzando reintento de MP");
                        }
                    } else {
                        console.log("Aviso: Faltan credenciales ZIPPIN para crear remitos automáticos.");
                    }
                }
                
                // === 2. ENVÍO DE CORREOS VÍA BREVO ===
                if(process.env.BREVO_API_KEY) {
                    
                    const sellerEmail = process.env.SELLER_EMAIL || "tu-correo-real@gmail.com";
                    
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
                                    <p><strong>Nombre:</strong> ${metadata.customer_name}</p>
                                    <p><strong>DNI:</strong> ${metadata.customer_dni}</p>
                                    <p><strong>Teléfono:</strong> ${metadata.customer_phone}</p>
                                    <p><strong>Email:</strong> ${metadata.customer_email}</p>
                                    
                                    <h3 style="margin-top: 20px; color: #3a2640;">Datos de entrega</h3>
                                    <p><strong>Tipo:</strong> ${metadata.delivery_type === 'pickup' ? 'Retiro en persona' : 'Envio a Domicilio'}</p>
                                    ${metadata.delivery_type === 'shipping' ? `
                                        <p><strong>Dirección:</strong> ${metadata.address}, ${metadata.city}, ${metadata.province} (CP: ${metadata.zip})</p>
                                    ` : ''}
                                </div>
                                <hr style="border: none; border-top: 1px solid #eee;">
                                <p style="text-align: center; margin-top: 20px;">
                                    <a href="https://wa.me/549${metadata.customer_phone.replace(/\D/g,'')}" style="display:inline-block; padding: 12px 25px; background-color: #25D366; color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">Contactar por WhatsApp al cliente</a>
                                </p>
                            </div>
                        `
                    };

                    const resVendor = await fetch("https://api.brevo.com/v3/smtp/email", {
                        method: "POST",
                        headers: { "Accept": "application/json", "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
                        body: JSON.stringify(brevoPayloadVendedora)
                    });
                    if (!resVendor.ok) throw new Error("Error en API de correos (Vendedor), forzando reintento.");
                    
                    // B) Correo automático PARA EL CLIENTE
                    if (metadata.customer_email && metadata.customer_email !== 'Vacio') {
                        const textEnvio = metadata.delivery_type === 'shipping' 
                            ? `<p>Estamos preparando tu libro de manera física. Una vez despachado en el correo, recibirás el código de seguimiento. Enlace general de seguimiento online (asignado): ${logisticaTrackingUrl}</p>`
                            : `<p>Has seleccionado "Retiro en persona". Por favor, envíanos un mensajito para coordinar por dónde vas a pasar a buscarlo!</p>`;
                            
                        const brevoPayloadCliente = {
                            sender: { name: "Cecilia Karina Rosso", email: sellerEmail }, 
                            to: [{ email: metadata.customer_email, name: metadata.customer_name }],
                            subject: `Recibimos tu pago 🤍 ¡Gracias por tu compra!`,
                            htmlContent: `
                                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
                                    <h1 style="color: #b59ad6; text-align: center;">¡Gracias por sumarte, ${metadata.customer_name.split(' ')[0]}!</h1>
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
                            headers: { "Accept": "application/json", "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
                            body: JSON.stringify(brevoPayloadCliente)
                        });
                        if (!resClient.ok) throw new Error("Error en API de correos (Cliente), forzando reintento.");
                        console.log("Ambos emails (vendedor y comprador) fueron enviados exitosamente.");
                    }
                } else {
                    console.log("No se envía correo porque falta la variable BREVO_API_KEY");
                }
            }
        }

        return { statusCode: 200, body: 'OK' }; // Siempre devolver 200 rápido a MP
    } catch (error) {
        console.error("Error procesando webhook:", error);
        // Retornamos 200 igual a veces para que MP no reviente, pero mejor 500 para tracear local
        return { statusCode: 500, body: 'Error interno' };
    }
};
