const fs = require('fs');
const path = require('path');
const { buildNotificationPreviews } = require('../netlify/functions/webhook');
const { buildTrackingUpdateEmail } = require('../netlify/functions/zippin-webhook');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

const metadata = {
    order_id: 'MP-1790000000000',
    customer_name: 'Cliente Ejemplo',
    customer_phone: '1100000000',
    customer_email: 'cliente@example.com',
    customer_dni: '00000000',
    delivery_type: 'shipping',
    shipping_postal_code: '1000',
    shipping_province: 'Ciudad Autonoma de Buenos Aires',
    shipping_city: 'Buenos Aires',
    shipping_street: 'Calle Ejemplo',
    shipping_number: '123',
    cart_snapshot: JSON.stringify([{ id: 'libro_vol1', quantity: 1 }]),
    shipping_apartment: 'A',
    subtotal: '25000',
    shipping_cost: '6500',
    total: '31500'
};

const shippingRecord = {
    tracking_number: 'ZIP123456789',
    tracking_url: 'https://app.zipnova.com.ar/track/ZIP123456789',
    shipping_status: 'created'
};

fs.mkdirSync(docsDir, { recursive: true });

const previews = buildNotificationPreviews({ metadata, shippingRecord });
const sellerPath = path.join(docsDir, 'preview-email-vendedor.html');
const customerPath = path.join(docsDir, 'preview-email-comprador.html');

fs.writeFileSync(sellerPath, previews.sellerEmailHtml);
fs.writeFileSync(customerPath, previews.customerEmailHtml);

const errorPreviews = buildNotificationPreviews({ metadata, shippingRecord: {}, zipnovaError: 'Zipnova rechazo la creacion del envio (422)' });
const sellerErrorPath = path.join(docsDir, 'preview-email-vendedor-error.html');
fs.writeFileSync(sellerErrorPath, errorPreviews.sellerEmailHtml);

const trackingPath = path.join(docsDir, 'preview-email-seguimiento.html');
fs.writeFileSync(trackingPath, buildTrackingUpdateEmail({ trackingCode: shippingRecord.tracking_number, status: 'en camino' }));

console.log('Previews generadas:');
console.log(`- ${sellerPath}`);
console.log(`- ${customerPath}`);
console.log(`- ${sellerErrorPath}`);
console.log(`- ${trackingPath}`);
console.log('');
console.log('Texto WhatsApp:');
console.log(previews.whatsAppText);
