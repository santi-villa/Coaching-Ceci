exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { zip_dest } = body;

        if (!zip_dest) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing postal code" }) };
        }

        let shippingCost = 1500; // Costo por defecto fallback original

        // === INTEGRACIÓN ZIPPIN ===
        if (process.env.ZIPPIN_API_KEY && process.env.ZIPPIN_API_SECRET) {
            try {
                // Autenticación de Zippin: Basic base64(KEY:SECRET)
                const authString = Buffer.from(process.env.ZIPPIN_API_KEY + ':' + process.env.ZIPPIN_API_SECRET).toString('base64');

                // NOTA: Zippin cambió de nombre a Zipnova, actualizamos la URL oficial
                const response = await fetch("https://api.zipnova.com.ar/v2/shipments/quote", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Basic ${authString}`
                    },
                    body: JSON.stringify({
                        account_id: 21020,
                        declared_value: 30000, // Requerido por Zipnova v2
                        origin: { zipcode: "1416" }, // Reemplazar con el CP de tu casa (origen)
                        destination: { zipcode: zip_dest, city: "Ciudad", state: "Provincia" }, // Añadidas prop obligatorias
                        packages: [
                            { length: 21, width: 15, height: 1, weight: 100, classification_id: 1 } // Medidas aproximadas libro empacado en mm o gramos seq Zippin
                        ]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.all_results && data.all_results.length > 0) {
                        // El v2 devuelve la lista en all_results y el precio dentro de amounts.price
                        shippingCost = data.all_results[0].amounts.price || shippingCost;
                    }
                } else {
                    console.log("Error en API de Zipnova (Cotizacion):", response.status);
                    // Si falla por configuración en Zippin, caerá al default pacíficamente.
                }
            } catch (e) {
                console.error("Fallo la llamada a Zipnova:", e);
            }
        }

        // Simulamos un delay de red de 600ms para que se sienta real en el front y el botón reaccione
        await new Promise(resolve => setTimeout(resolve, 600));

        return {
            statusCode: 200,
            body: JSON.stringify({ cost: shippingCost })
        };

    } catch (error) {
        console.error("Error quoting shipping:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error calculating constraints' }) };
    }
};
