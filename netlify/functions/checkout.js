const { MercadoPagoConfig, Preference } = require('mercadopago');

exports.handler = async (event) => {
    // Solo permitimos peticiones POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        // 1. Recibimos los datos de tu JS
        const { cart, delivery } = JSON.parse(event.body);

        // 2. ¡ACÁ ESTÁ LA VARIABLE DE ENTORNO!
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

        // 4. Sumamos el envío si corresponde (ejemplo: tarifa plana $5000)
        if (delivery === 'shipping') {
            items.push({
                id: 'envio',
                title: 'Costo de Envío a Domicilio',
                quantity: 1,
                unit_price: 2300,
                currency_id: 'ARS',
            });
        }

        // 5. Creamos la preferencia
        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: items,
                back_urls: {
                    success: "https://tudominio.com.ar/index.html#success-view",
                    failure: "https://tudominio.com.ar/index.html",
                    pending: "https://tudominio.com.ar/index.html"
                },
                auto_return: "approved",
            }
        });

        // 6. Devolvemos el link al frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ init_point: result.init_point })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error creando preferencia" })
        };
    }
};