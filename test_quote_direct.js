require('dotenv').config();
async function test() {
    const authString = Buffer.from(process.env.ZIPPIN_API_KEY + ':' + process.env.ZIPPIN_API_SECRET).toString('base64');
    const response = await fetch("https://api.zipnova.com.ar/v2/shipments/quote", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Basic ${authString}`
        },
        body: JSON.stringify({
            account_id: 21020,
            declared_value: 30000,
            origin: { zipcode: "1416" },
            destination: { zipcode: "1000", city: "Ciudad", state: "Provincia" },
            packages: [
                { length: 21, width: 15, height: 1, weight: 100, classification_id: 1 }
            ]
        })
    });
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
}
test();
