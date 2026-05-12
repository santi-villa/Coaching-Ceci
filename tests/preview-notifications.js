const fs = require('fs');
const path = require('path');
const { buildNotificationPreviews } = require('../netlify/functions/webhook');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

const metadata = {
    order_id: 'MP-1790000000000',
    customer_name: 'Santiago Perez',
    customer_phone: '1132143375',
    customer_email: 'santiago@example.com',
    customer_dni: '44599886',
    delivery_type: 'shipping',
    shipping_postal_code: '1414',
    shipping_province: 'Ciudad Autonoma de Buenos Aires',
    shipping_city: 'Villa Crespo',
    shipping_street: 'Warnes Av.',
    shipping_number: '1125',
    shipping_apartment: '2B',
    subtotal: '25000',
    shipping_cost: '6500',
    total: '31500'
};

const shippingRecord = {
    tracking_number: 'ZIP123456789',
    tracking_url: 'https://app.zipnova.com.ar/track/ZIP123456789',
    shipping_status: 'created'
};

function wrapPreview(title, body) {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;background:#f4edf5">
${body}
</body>
</html>
`;
}

fs.mkdirSync(docsDir, { recursive: true });

const previews = buildNotificationPreviews({ metadata, shippingRecord });
const sellerPath = path.join(docsDir, 'preview-email-vendedor.html');
const customerPath = path.join(docsDir, 'preview-email-comprador.html');

fs.writeFileSync(sellerPath, wrapPreview('Preview email vendedor', previews.sellerEmailHtml));
fs.writeFileSync(customerPath, wrapPreview('Preview email comprador', previews.customerEmailHtml));

console.log('Previews generadas:');
console.log(`- ${sellerPath}`);
console.log(`- ${customerPath}`);
console.log('');
console.log('Texto WhatsApp:');
console.log(previews.whatsAppText);
