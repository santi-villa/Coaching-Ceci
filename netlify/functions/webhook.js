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

                // === 1. INTEGRACIÓN LOGÍSTICA (ZIPPIN / ZIPNOVA) ===
                if (metadata.delivery_type === 'shipping') {
                    const zippinKey = (process.env.ZIPPIN_API_KEY || "").replace(/["']/g, '').trim();
                    const zippinSecret = (process.env.ZIPPIN_API_SECRET || "").replace(/["']/g, '').trim();

                    if (zippinKey && zippinSecret) {
                        try {
                            console.log("Creando remito en Zippin/Zipnova...");
                            const authString = Buffer.from(zippinKey + ':' + zippinSecret).toString('base64');

                            // El payload de creación de envío con todos los datos recolectados
                            const zippinPayload = {
                                account_id: 21020,
                                declared_value: payment.transaction_amount || 24900,
                                origin: { zipcode: "1414" }, // CP de Villa Crespo extraído automáticamente de la cuenta de Zippin
                                destination: {
                                    name: metadata.customer_name || "Comprador",
                                    document_type: "DNI",
                                    document_number: metadata.customer_dni || "0",
                                    phone: metadata.customer_phone || "0",
                                    email: metadata.customer_email || "nodata@example.com",
                                    address: metadata.address || "S/D",
                                    city: metadata.city || "S/C",
                                    state: metadata.province || "S/P",
                                    zipcode: metadata.zip || "1000",
                                    reference: `Orden de ${metadata.customer_name}`
                                },
                                packages: [
                                    { length: 21, width: 15, height: 1, weight: 100, classification_id: 1 } 
                                ]
                            };

                            const resZippin = await fetch("https://api.zipnova.com.ar/v2/shipments", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Accept": "application/json",
                                    "Authorization": `Basic ${authString}`
                                },
                                body: JSON.stringify(zippinPayload)
                            });

                            if (resZippin.ok) {
                                const zippinData = await resZippin.json();
                                console.log("✅ Remito CREADO en Zipnova:", zippinData);

                                // Extraemos el código de seguimiento real si existe
                                if (zippinData.tracking_code) {
                                    logisticaTrackingUrl = `https://www.zipnova.com/rastreo?tracking=${zippinData.tracking_code}`;
                                }
                            } else {
                                const errorText = await resZippin.text();
                                console.error("❌ Error conectando con ZIPNOVA:", resZippin.status, errorText);
                            }
                        } catch (err) {
                            console.error("Error catcheado creando remito:", err);
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
                                    <a href="https://wa.me/549${(metadata.customer_phone || '').replace(/\D/g, '')}" style="display:inline-block; padding: 12px 25px; background-color: #25D366; color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">Contactar por WhatsApp al cliente</a>
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
                                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid #f0f0f0; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                                        <!-- Header -->
                                        <div style="background-color: #fcfafc; padding: 30px 20px; text-align: center; border-bottom: 2px solid #f0eaef;">
                                            <div style="width: 60px; height: 60px; background-color: #ffffff; border-radius: 50%; margin: 0 auto 15px; line-height: 60px; font-size: 24px; font-weight: bold; color: #b59ad6; border: 1px solid #e8e2eb;">
                                                CR
                                            </div>
                                            <h1 style="color: #3a2640; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">¡Tu ejemplar ya tiene dueño!</h1>
                                        </div>

                                        <!-- Body -->
                                        <div style="padding: 40px 30px;">
                                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-top: 0;">
                                                ¡Hola <strong>${(metadata.customer_name || 'estimado/a').split(' ')[0]}</strong>! 🤍
                                            </p>
                                            <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                                                Qué alegría enorme confirmar que hemos recibido exitosamente el pago por tu libro <em>"Comunicar para vivir más livianos"</em>. 
                                            </p>
                                            
                                            <!-- Status Box -->
                                            <div style="background-color: #faf5fa; border: 1px solid #e8e2eb; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                                <h3 style="color: #3a2640; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📦 Sobre tu envío</h3>
                                                <p style="color: #666666; font-size: 15px; line-height: 1.5; margin: 0;">
                                                    En este momento estamos preparándolo. Como elegiste <strong>envío a domicilio</strong>, una vez que el correo retire tu paquete, te llegará un nuevo email automático (a esta misma dirección) con el <strong>Código de Seguimiento</strong> oficial.
                                                </p>
                                            </div>

                                            <p style="color: #777777; font-size: 14px; line-height: 1.5; text-align: center; margin-bottom: 0;">
                                                <em>💡 Tip: Si pasan 48hs hábiles y no recibes el código, por favor revisa tu carpeta de Spam.</em>
                                            </p>
                                        </div>

                                        <!-- Footer -->
                                        <div style="background-color: #3a2640; padding: 30px; text-align: center;">
                                            <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 15px; opacity: 0.9;">
                                                Cualquier consulta, estamos a un mensaje de distancia.
                                            </p>
                                            <a href="https://instagram.com/ceciliarosso.coach" style="display: inline-block; background-color: #b59ad6; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 50px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">
                                                Hablame por Instagram
                                            </a>
                                        </div>
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

                // === 3. NOTIFICACIÓN POR WHATSAPP (CALLMEBOT) ===
                // Servicio gratuito para enviarte mensajes a tu propio WhatsApp
                const callMeBotPhone = (process.env.CALLMEBOT_PHONE || "").trim();
                const callMeBotApiKey = (process.env.CALLMEBOT_API_KEY || "").trim();

                if (callMeBotPhone && callMeBotApiKey) {
                    try {
                        const wppMessage = `🛒 ¡Nueva Venta de Libro!\n👤 Comprador: ${metadata.customer_name || 'Desconocido'}\n📞 Teléfono: ${metadata.customer_phone || '-'}\n📦 Tipo: ${metadata.delivery_type === 'pickup' ? 'Retiro' : 'Envio'}`;
                        const url = `https://api.callmebot.com/whatsapp.php?phone=${callMeBotPhone}&text=${encodeURIComponent(wppMessage)}&apikey=${callMeBotApiKey}`;

                        const resWpp = await fetch(url);
                        if (resWpp.ok) {
                            console.log("✅ Notificación automática por WhatsApp enviada.");
                        } else {
                            console.error("❌ Error enviando WhatsApp vía CallMeBot:", resWpp.status);
                        }
                    } catch (e) {
                        console.error("❌ Excepción al enviar WhatsApp:", e);
                    }
                } else {
                    console.log("ℹ️ Notificación WhatsApp omitida (faltan variables CALLMEBOT_PHONE y/o CALLMEBOT_API_KEY)");
                }

                // === 4. ENVIAR AL PANEL DE GOOGLE SHEETS (APPS SCRIPT) ===
                // ⚠️ ATENCION: El scriptUrl DEBE ser la URL de implentación de Apps Script (https://script.google.com/macros/...)
                // y NO el ID de la planilla suelto. Si pones el ID de la planilla la llamada falla en el servidor.
                const scriptUrl = "https://script.google.com/macros/s/REEMPLAZAR_ESTO/exec"; // Reemplazar con URL real
                
                if (scriptUrl && scriptUrl.includes("script.google.com")) {
                    try {
                        const addressCompleta = metadata.delivery_type === 'shipping'
                            ? `${metadata.address || ''}, ${metadata.city || ''}, ${metadata.province || ''} (CP: ${metadata.zip || ''})`
                            : 'Retira en persona';
            
                        await fetch(scriptUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                customer_name: metadata.customer_name,
                                customer_dni: metadata.customer_dni,
                                customer_email: metadata.customer_email,
                                customer_phone: metadata.customer_phone,
                                delivery_type: metadata.delivery_type,
                                address: addressCompleta
                            })
                        });
                        console.log("✅ Venta registrada en Google Sheets (Panel)");
                    } catch (sheetError) {
                        console.error("❌ Error enviando datos a Sheets:", sheetError);
                    }
                }
            }
        }

        return { statusCode: 200, body: 'OK' }; // Siempre devolver 200 rápido a MP si el formato fue correcto
    } catch (error) {
        console.error("🔥 Error interno procesando webhook:", error);
        return { statusCode: 500, body: 'Error interno' };
    }
};
