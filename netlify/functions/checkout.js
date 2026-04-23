const { MercadoPagoConfig, Preference } = require('mercadopago');

exports.handler = async (event) => {
    // Solo permitimos peticiones POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        // 1. Extraemos el body enviado por nuestro JS usando destructuring
        const { cart, delivery, customer, shippingCost } = JSON.parse(event.body);

        // 2. Inicializamos Mercado Pago (con el Token)ENTORNO!
        // Netlify va a inyectar tu clave real automáticamente
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

        // 3. Mapeamos el carrito
        let items = cart.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            unit_price: item.price,
            currency_id: 'ARS',
        }));

        // 4. Sumamos el envío si corresponde
        if (delivery === 'shipping' && shippingCost) {
            items.push({
                id: 'envio',
                title: 'Costo de Envío (Cotizado)',
                quantity: 1,
                unit_price: Number(shippingCost),
                currency_id: 'ARS',
            });
        }

        // 5. Detectamos la URL base (Netlify en PROD, hardcode seguro en DEV para MP)
        let baseUrl = process.env.URL || 'https://ceciliarosso.netlify.app';
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            baseUrl = 'https://ceciliarosso.netlify.app';
        }
        if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
        
        console.log("Base URL detectada:", baseUrl);
        console.log("Items enviados a MP:", JSON.stringify(items, null, 2));

        // 6. Creamos la preferencia
        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: items,
                metadata: {
                    customer_name: customer?.name || 'Vacio',
                    customer_phone: customer?.phone || 'Vacio',
                    customer_email: customer?.email || 'Vacio',
                    customer_dni: customer?.dni || 'Vacio',
                    delivery_type: delivery || 'Vacio',
                    address: customer?.address || 'Vacio',
                    city: customer?.city || 'Vacio',
                    zip: customer?.zip || 'Vacio',
                    province: customer?.province || 'Vacio'
                },
                back_urls: {
                    success: `${baseUrl}/index.html?status=approved`,
                    failure: `${baseUrl}/index.html?status=failure`,
                    pending: `${baseUrl}/index.html?status=pending`
                },
                notification_url: baseUrl.includes('localhost') ? undefined : `${baseUrl}/.netlify/functions/webhook`,
                auto_return: "approved",
            }
        });

        // 6. Devolvemos el link al frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ init_point: result.init_point })
        };

    } catch (error) {
        console.error("Error detallado de Mercado Pago:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "Error creando preferencia",
                details: error.message || error 
            })
        };
    }
};