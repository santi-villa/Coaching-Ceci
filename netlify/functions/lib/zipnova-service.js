const {
    calculatePackageDimensions,
    isAllowedCarrierDropoffOption,
    isHomeDeliveryOption,
    normalizeAddress,
    numberOrZero
} = require('./shipping-utils');

const ZIPNOVA_BASE_URL = 'https://api.zipnova.com.ar/v2';
const DEFAULT_ACCOUNT_ID = 21020;
const DEFAULT_ORIGIN_ID = 377048;
const ORIGIN_ZIPCODE = '1414';

function getAuthHeader() {
    const apiKey = (process.env.ZIPPIN_API_KEY || process.env.ZIPNOVA_API_KEY || '').replace(/["']/g, '').trim();
    const apiSecret = (process.env.ZIPPIN_API_SECRET || process.env.ZIPNOVA_API_SECRET || '').replace(/["']/g, '').trim();

    if (!apiKey || !apiSecret) {
        throw new Error('Faltan credenciales de Zipnova.');
    }

    return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
}

function getAccountId() {
    return Number(process.env.ZIPNOVA_ACCOUNT_ID || process.env.ZIPPIN_ACCOUNT_ID || DEFAULT_ACCOUNT_ID);
}

function getOriginId() {
    return Number(process.env.ZIPNOVA_ORIGIN_ID || process.env.ZIPPIN_ORIGIN_ID || DEFAULT_ORIGIN_ID);
}

function getPrice(rate = {}) {
    return numberOrZero(rate.amounts?.price_incl_tax || rate.amounts?.price || rate.price_incl_tax || rate.price);
}

function normalizeDeliveryTime(deliveryTime = {}) {
    if (!deliveryTime || typeof deliveryTime !== 'object') return null;

    return {
        min_days: deliveryTime.min ?? null,
        max_days: deliveryTime.max ?? null,
        estimated_delivery: deliveryTime.estimated_delivery || null,
        raw: deliveryTime
    };
}

function normalizeQuoteRate(rate = {}) {
    const cost = getPrice(rate);
    const normalized = {
        logistic_type: rate.logistic_type || null,
        service_type: typeof rate.service_type === 'string' ? rate.service_type : rate.service_type?.code || null,
        service_type_name: typeof rate.service_type === 'object' ? rate.service_type?.name || null : null,
        carrier_id: rate.carrier?.id ?? null,
        carrier_name: rate.carrier?.name || null,
        shipping_cost: cost,
        rate_id: rate.rate?.id ?? null,
        tariff_id: rate.rate?.tariff_id ?? null,
        delivery_time: normalizeDeliveryTime(rate.delivery_time),
        shipping_method_visible: 'Envio a domicilio'
    };

    return normalized;
}

function selectCheapestHomeDelivery(results = []) {
    const homeDeliveryRates = results
        .filter(rate => rate?.selectable !== false)
        .filter(isHomeDeliveryOption)
        .filter(isAllowedCarrierDropoffOption)
        .map(normalizeQuoteRate)
        .filter(rate => rate.shipping_cost > 0)
        .sort((a, b) => a.shipping_cost - b.shipping_cost);

    if (!homeDeliveryRates.length) {
        throw new Error('No hay opciones de envio a domicilio con Correo Argentino, OCA o Andreani para esa direccion.');
    }

    return homeDeliveryRates[0];
}

function buildPackage(cartItems) {
    const dimensions = calculatePackageDimensions(cartItems);
    return {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        weight: dimensions.weightGrams,
        classification_id: dimensions.classification_id,
        description_1: 'Comunicar para vivir mas livianos'
    };
}

async function quoteHomeDelivery({ cartItems, address, declaredValue }) {
    const destination = normalizeAddress(address);
    const packageItem = buildPackage(cartItems);
    const response = await fetch(`${ZIPNOVA_BASE_URL}/shipments/quote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
            account_id: getAccountId(),
            declared_value: Math.max(1, Math.round(numberOrZero(declaredValue))),
            origin: { zipcode: ORIGIN_ZIPCODE },
            destination: {
                zipcode: destination.postalCode,
                city: destination.city,
                state: destination.province
            },
            packages: [packageItem]
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Zipnova rechazo la cotizacion (${response.status}): ${text}`);
    }

    const data = await response.json();
    const results = Array.isArray(data.all_results)
        ? data.all_results
        : Object.values(data.results || {});
    const selected = selectCheapestHomeDelivery(results);

    return {
        cost: selected.shipping_cost,
        quote: selected,
        package: packageItem,
        rawDestination: data.destination || null
    };
}

async function createShipment({ paymentId, customer, address, cartItems, declaredValue, shippingQuote }) {
    const destination = normalizeAddress(address);
    const packageItem = buildPackage(cartItems);
    const externalId = `MP-${paymentId}`;
    const payload = {
        account_id: getAccountId(),
        origin_id: getOriginId(),
        external_id: externalId,
        logistic_type: shippingQuote?.logistic_type,
        service_type: shippingQuote?.service_type,
        declared_value: Math.max(1, Math.round(numberOrZero(declaredValue))),
        source: 'ceciliarosso-web',
        destination: {
            name: customer?.name || 'Comprador',
            document: customer?.dni || '0',
            phone: customer?.phone || '0',
            email: customer?.email || 'nodata@example.com',
            street: destination.street,
            street_number: destination.number,
            street_extras: destination.apartment || null,
            city: destination.city,
            state: destination.province,
            zipcode: destination.postalCode,
            reference: `Orden Mercado Pago ${paymentId}`
        },
        packages: [packageItem]
    };

    if (shippingQuote?.carrier_id) payload.carrier_id = shippingQuote.carrier_id;
    if (shippingQuote?.rate_id) payload.rate_id = shippingQuote.rate_id;
    if (shippingQuote?.tariff_id) payload.tariff_id = shippingQuote.tariff_id;

    const response = await fetch(`${ZIPNOVA_BASE_URL}/shipments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': getAuthHeader()
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Zipnova rechazo la creacion del envio (${response.status}): ${text}`);
    }

    const data = await response.json();
    return {
        shipment_id: data.id || data.shipment_id || null,
        tracking_number: data.carrier_tracking_id || data.carrier_tracking_id_alt || data.delivery_id || null,
        tracking_url: data.tracking_external || data.tracking || null,
        label_url: data.label_url || data.label || data.documentation_url || null,
        carrier_name: data.carrier?.name || shippingQuote?.carrier_name || null,
        status: data.status || data.status_name || 'created',
        raw: data
    };
}

async function getTracking() {
    return null;
}

async function getLabel() {
    return null;
}

module.exports = {
    createShipment,
    getLabel,
    getTracking,
    normalizeQuoteRate,
    quoteHomeDelivery,
    selectCheapestHomeDelivery
};
