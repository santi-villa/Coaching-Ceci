const BOOK_LENGTH_CM = 25;
const BOOK_WIDTH_CM = 15;
const BOOK_HEIGHT_CM = 1;
const BOOK_WEIGHT_KG = 0.1;
const BOOK_CLASSIFICATION_ID = 1;
const PRODUCT_CATALOG = {
    libro_vol1: {
        id: 'libro_vol1',
        title: 'Comunicar para vivir mas livianos',
        price: 25000
    }
};

function numberOrZero(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getCartQuantity(cartItems = []) {
    return cartItems.reduce((sum, item) => sum + Math.max(0, Math.trunc(numberOrZero(item.quantity))), 0);
}

function normalizeCartItems(cartItems = []) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error('El carrito esta vacio.');
    }

    const normalized = cartItems.map(item => {
        const product = PRODUCT_CATALOG[item?.id];
        const quantity = Math.max(0, Math.trunc(numberOrZero(item?.quantity)));

        if (!product) {
            throw new Error('El carrito contiene un producto no disponible.');
        }
        if (quantity <= 0) {
            throw new Error('El carrito contiene una cantidad invalida.');
        }

        return {
            id: product.id,
            title: product.title,
            price: product.price,
            quantity
        };
    });

    return normalized;
}

function calculateSubtotal(cartItems = []) {
    return normalizeCartItems(cartItems).reduce((sum, item) => {
        const quantity = Math.max(0, Math.trunc(numberOrZero(item.quantity)));
        return sum + (numberOrZero(item.price) * quantity);
    }, 0);
}

function calculatePackageDimensions(cartItems = []) {
    const quantity = getCartQuantity(normalizeCartItems(cartItems));

    if (quantity <= 0) {
        throw new Error('El carrito no tiene libros para enviar.');
    }

    return {
        quantity,
        length: BOOK_LENGTH_CM,
        width: BOOK_WIDTH_CM,
        height: Math.max(1, quantity * BOOK_HEIGHT_CM),
        weightKg: Number((quantity * BOOK_WEIGHT_KG).toFixed(2)),
        weightGrams: Math.max(1, Math.round(quantity * BOOK_WEIGHT_KG * 1000)),
        classification_id: BOOK_CLASSIFICATION_ID
    };
}

function normalizeAddress(address = {}) {
    const normalized = {
        postalCode: String(address.postalCode || address.zip || address.zip_dest || '').trim(),
        province: String(address.province || address.state || '').trim(),
        city: String(address.city || address.locality || address.localidad || '').trim(),
        street: String(address.street || address.calle || '').trim(),
        number: String(address.number || address.streetNumber || address.altura || '').trim(),
        apartment: String(address.apartment || address.floorApartment || address.pisoDepto || '').trim()
    };

    const missing = [];
    if (!normalized.postalCode) missing.push('codigo postal');
    if (!normalized.province) missing.push('provincia');
    if (!normalized.city) missing.push('localidad');
    if (!normalized.street) missing.push('calle');
    if (!normalized.number) missing.push('numero');

    if (missing.length) {
        throw new Error(`Faltan datos de direccion: ${missing.join(', ')}.`);
    }

    return normalized;
}

function buildAddressKey(address) {
    const normalized = normalizeAddress(address);
    return [
        normalized.postalCode,
        normalized.province,
        normalized.city,
        normalized.street,
        normalized.number,
        normalized.apartment
    ].map(value => value.toLowerCase()).join('|');
}

function buildCartKey(cartItems = []) {
    return cartItems
        .map(item => `${item.id || item.title}:${Math.max(0, Math.trunc(numberOrZero(item.quantity)))}`)
        .sort()
        .join('|');
}

function validateShippingOption(option) {
    if (!option || typeof option !== 'object') {
        throw new Error('No hay una opcion de envio valida.');
    }

    const cost = numberOrZero(option.shipping_cost || option.cost);
    if (cost <= 0) {
        throw new Error('La opcion de envio no tiene costo valido.');
    }

    if (!isHomeDeliveryOption(option)) {
        throw new Error('La opcion seleccionada no es envio a domicilio.');
    }

    return true;
}

function getServiceCode(option = {}) {
    if (typeof option.service_type === 'string') return option.service_type;
    return option.service_type?.code || option.service_type?.name || '';
}

function isHomeDeliveryOption(option = {}) {
    const serviceCode = String(getServiceCode(option)).toLowerCase();
    const serviceName = String(option.service_type?.name || option.service_name || option.shipping_method_visible || '').toLowerCase();

    if (serviceCode.includes('pickup') || serviceName.includes('punto') || serviceName.includes('sucursal')) {
        return false;
    }

    return serviceCode === 'standard_delivery' ||
        serviceCode.includes('delivery') ||
        serviceName.includes('domicilio');
}

module.exports = {
    buildAddressKey,
    buildCartKey,
    calculatePackageDimensions,
    calculateSubtotal,
    getCartQuantity,
    isHomeDeliveryOption,
    normalizeAddress,
    normalizeCartItems,
    numberOrZero,
    validateShippingOption
};
