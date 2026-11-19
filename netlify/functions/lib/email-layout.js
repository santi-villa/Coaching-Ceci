// Plantilla comun de los mails del sitio, con la misma estetica de la web:
// fondo crema, loto, titulos en serif marron, detalles en turquesa y botones pildora.
// Todo va con estilos en linea y tablas, que es lo que respetan Gmail, Outlook y Apple Mail.
const { escapeHtml } = require('./webhook-auth');

const COLORS = {
    page: '#F6EEE4',
    card: '#FCFAF6',
    text: '#4A382B',
    muted: '#735C46',
    teal: '#2A7A7D',
    tealSoft: '#E6F4F2',
    border: '#EADBCB',
    warnSoft: '#FBEDE7',
    warnText: '#9A3F2A'
};

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Helvetica, Arial, sans-serif";

function siteUrl() {
    const isProduction = (process.env.CONTEXT || 'production') === 'production';
    let url = String((isProduction ? process.env.URL : (process.env.DEPLOY_PRIME_URL || process.env.URL)) || '').trim();
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) url = 'https://ceciliarosso.netlify.app';
    if (!url.startsWith('http')) url = `https://${url}`;
    return url.replace(/\/+$/, '');
}

function button(href, label) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px auto 22px">
        <tr><td style="border-radius:999px;background:${COLORS.teal}">
            <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 30px;border-radius:999px;color:#ffffff;font-family:${SANS};font-size:16px;font-weight:700;text-decoration:none">${label}</a>
        </td></tr>
    </table>`;
}

// Tarjeta con filas "Etiqueta: valor". rows = [[etiqueta, valorHtml], ...]
function infoCard(title, rows = [], { tone = 'neutral' } = {}) {
    const bg = tone === 'teal' ? COLORS.tealSoft : tone === 'warn' ? COLORS.warnSoft : '#FFFFFF';
    const border = tone === 'warn' ? '#F0CFC3' : COLORS.border;
    const rowsHtml = rows.map(([label, value]) => `
        <tr>
            <td style="padding:6px 0;font-family:${SANS};font-size:13px;color:${COLORS.muted};vertical-align:top;width:38%">${label}</td>
            <td style="padding:6px 0;font-family:${SANS};font-size:15px;color:${COLORS.text};vertical-align:top;font-weight:600;word-break:break-word;overflow-wrap:anywhere">${value}</td>
        </tr>`).join('');

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;background:${bg};border:1px solid ${border};border-radius:16px">
        <tr><td style="padding:18px 20px">
            ${title ? `<p style="margin:0 0 8px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${tone === 'warn' ? COLORS.warnText : COLORS.teal}">${title}</p>` : ''}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed">${rowsHtml}</table>
        </td></tr>
    </table>`;
}

function paragraph(html, { muted = false, size = 16, align = 'left' } = {}) {
    return `<p style="margin:0 0 14px;font-family:${SANS};font-size:${size}px;line-height:1.6;color:${muted ? COLORS.muted : COLORS.text};text-align:${align}">${html}</p>`;
}

function notice(html, { tone = 'teal' } = {}) {
    const bg = tone === 'warn' ? COLORS.warnSoft : COLORS.tealSoft;
    const color = tone === 'warn' ? COLORS.warnText : COLORS.text;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0">
        <tr><td style="padding:14px 18px;border-radius:14px;background:${bg};font-family:${SANS};font-size:14px;line-height:1.55;color:${color}">${html}</td></tr>
    </table>`;
}

/**
 * Arma el mail completo.
 * @param {object} o
 * @param {string} o.preheader  Texto corto que muestran las casillas junto al asunto.
 * @param {string} o.eyebrow    Pildora chica arriba del titulo.
 * @param {string} o.title      Titulo principal.
 * @param {string} o.bodyHtml   Contenido.
 * @param {boolean} [o.signature] Firma "Con cariño, Ceci".
 * @param {string} [o.footerHtml] Texto extra del pie (por ejemplo, la baja de una lista).
 * @param {string} [o.align]    'center' o 'left' para el encabezado.
 */
function renderEmail({ preheader = '', eyebrow = '', title = '', bodyHtml = '', signature = true, footerHtml = '', align = 'center' }) {
    const base = siteUrl();
    const logo = `${base}/assets/images/email-logo.png`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${COLORS.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLORS.page}">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.page}">
<tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
        <tr><td align="center" style="padding:0 0 18px">
            <a href="${base}" style="text-decoration:none">
                <img src="${logo}" width="48" alt="" style="display:inline-block;width:48px;height:auto;border:0;vertical-align:middle">
                <span style="font-family:${SERIF};font-size:22px;font-weight:600;color:${COLORS.text};vertical-align:middle;padding-left:8px">Cecilia <span style="font-style:italic;font-weight:400;color:${COLORS.teal}">Rosso</span></span>
            </a>
        </td></tr>
        <tr><td style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:24px;padding:34px 30px 30px">
            <div style="text-align:${align}">
                ${eyebrow ? `<span style="display:inline-block;margin:0 0 14px;padding:6px 14px;border-radius:999px;background:${COLORS.tealSoft};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${COLORS.teal}">${eyebrow}</span>` : ''}
                <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:600;color:${COLORS.text}">${title}</h1>
            </div>
            ${bodyHtml}
            ${signature ? `<p style="margin:26px 0 0;font-family:${SERIF};font-size:22px;font-style:italic;color:${COLORS.teal}">Con cariño, Ceci</p>` : ''}
        </td></tr>
        <tr><td align="center" style="padding:20px 10px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.muted}">
            ${footerHtml ? `${footerHtml}<br>` : ''}
            Cecilia Karina Rosso · <a href="${base}" style="color:${COLORS.teal};text-decoration:none">${base.replace(/^https?:\/\//, '')}</a> · <a href="https://instagram.com/ceciliarosso.coach" style="color:${COLORS.teal};text-decoration:none">@ceciliarosso.coach</a>
        </td></tr>
    </table>
</td></tr>
</table>
</body>
</html>`;
}

module.exports = { COLORS, SERIF, SANS, button, infoCard, notice, paragraph, renderEmail, siteUrl };
