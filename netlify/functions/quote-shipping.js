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
                
                // NOTA: Algunas cuentas viejas usan /v1/quotes Otras /v1/shipments?action=quote
                // Dejamos lista la llamada oficial
                const response = await fetch("https://api.zippin.com.ar/v1/quotes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Basic ${authString}`
                    },
                    body: JSON.stringify({
                        origin: { zip_code: "1181" }, // Reemplazar con el CP de tu casa (origen)
                        destination: { zip_code: zip_dest },
                        parcels: [
                            { length: 20, width: 15, height: 5, weight: 500 } // Medidas aproximadas libro empacado en mm o gramos seq Zippin
                        ]
                    })
                });
                
                if(response.ok) {
                    const data = await response.json();
                    // Zippin devuelve una lista de posibles correos (Andreani, Urbano, etc).
                    // Tomamos el más barato
                    if (data && data.length > 0) {
                        shippingCost = data[0].price || shippingCost;
                    }
                } else {
                    console.log("Error en API de Zippin (Cotizacion):", response.status);
                    // Si falla por configuración en Zippin, caerá al default pacíficamente.
                }
            } catch(e) {
                console.error("Fallo la llamada a Zippin:", e);
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
