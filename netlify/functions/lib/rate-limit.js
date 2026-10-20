// Limite por IP en memoria. En serverless cada instancia tiene su propio contador, asi que
// frena abusos simples (bucles) pero no reemplaza un limite en el borde.
const buckets = new Map();

function getClientIp(event) {
    const headers = event.headers || {};
    return headers['x-nf-client-connection-ip'] ||
        String(headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        'unknown';
}

function isRateLimited(event, { key, max = 20, windowMs = 10 * 60 * 1000 } = {}) {
    const now = Date.now();
    const bucketKey = `${key}:${getClientIp(event)}`;
    const recent = (buckets.get(bucketKey) || []).filter(time => now - time < windowMs);

    recent.push(now);
    buckets.set(bucketKey, recent);

    if (buckets.size > 500) {
        for (const [storedKey, times] of buckets) {
            if (!times.some(time => now - time < windowMs)) buckets.delete(storedKey);
        }
    }
    return recent.length > max;
}

module.exports = { isRateLimited };
