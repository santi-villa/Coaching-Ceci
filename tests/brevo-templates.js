// Genera las plantillas HTML para pegar en Brevo, con el mismo diseño que los mails del sitio.
// Uso: node tests/brevo-templates.js  ->  docs/brevo-confirmacion.html y docs/brevo-bienvenida-cuadernillo.html
// En Brevo: Plantillas > Nueva plantilla > "Pegar tu código" (HTML).
const fs = require('fs');
const path = require('path');
const { button, paragraph, renderEmail, siteUrl } = require('../netlify/functions/lib/email-layout');

const docsDir = path.resolve(__dirname, '..', 'docs');
const base = siteUrl();

// 1) Mail de confirmacion (doble opt-in). Brevo reemplaza {{ doubleoptin }} por el link de confirmacion.
const confirmacion = renderEmail({
    preheader: 'Tocá el botón para confirmar tu correo y recibir el cuadernillo.',
    eyebrow: 'Un paso más',
    title: 'Confirmá tu suscripción',
    bodyHtml: [
        paragraph('¡Gracias por sumarte! Solo falta que confirmes tu correo para recibir el <strong>cuadernillo gratuito</strong> y las novedades de Cecilia.', { align: 'center' }),
        button('{{ doubleoptin }}', 'Confirmar mi suscripción'),
        paragraph('Si no te suscribiste vos, podés ignorar este mail: no te vamos a escribir.', { muted: true, size: 13, align: 'center' })
    ].join('')
});

// 2) Bienvenida con el cuadernillo. Reemplazar LINK_AL_PDF por el link de descarga real.
const bienvenida = renderEmail({
    preheader: 'Acá tenés tu cuadernillo de búsqueda de propósito, en PDF y gratis.',
    eyebrow: 'Regalo 100% gratis',
    title: 'Tu cuadernillo ya está acá',
    bodyHtml: [
        `<div style="text-align:center;margin:4px 0 22px"><img src="${base}/assets/images/email-cuadernillo.jpg" width="200" alt="Cuadernillo Búsqueda de propósito y del sentido de vida" style="display:inline-block;width:200px;height:auto;border:0;border-radius:6px;box-shadow:0 10px 24px rgba(74,56,43,.18)"></div>`,
        paragraph('Gracias por confirmar tu suscripción. Te dejamos el cuadernillo <strong>Búsqueda de propósito y del sentido de vida</strong>: ejercicios y reflexiones para encontrar sentido a tu vida, a tu ritmo.', { align: 'center' }),
        button('LINK_AL_PDF', 'Descargar el PDF'),
        paragraph('Además, vas a recibir novedades sobre próximos libros, lanzamientos y reflexiones de Cecilia. Sin spam: solo cuando haya algo que valga la pena contarte.', { muted: true, size: 14, align: 'center' })
    ].join(''),
    footerHtml: 'Recibís este mail porque te suscribiste en ceciliarosso.com. <a href="{{ unsubscribe }}" style="color:#2A7A7D">Darte de baja</a>'
});

fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, 'brevo-confirmacion.html'), confirmacion);
fs.writeFileSync(path.join(docsDir, 'brevo-bienvenida-cuadernillo.html'), bienvenida);
console.log('Plantillas de Brevo generadas en docs/.');
