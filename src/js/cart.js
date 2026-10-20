const CART_STORAGE_KEY = 'cecilia-rosso-cart';
let cart = [];
let isCartOpen = false;
let quotedShippingCost = 0;
let quotedShippingQuote = null;
let quotedShippingAddressKey = '';
let quotedShippingCartKey = '';
let shippingQuoteTimer = null;
let shippingQuoteRequestId = 0;
const SHIPPING_AUTO_QUOTE_DELAY_MS = 900;
const MISSING_FIELD_MESSAGES = {
    'customer-email': 'Completá tu email.',
    'customer-name': 'Completá tu nombre.',
    'customer-lastname': 'Completá tu apellido.',
    'customer-dni': 'Completá tu DNI.',
    'customer-phone': 'Completá tu teléfono.',
    'street': 'Completá la calle.',
    'street-number': 'Completá el número.',
    'zip': 'Completá el código postal.',
    'city': 'Completá la localidad.',
    'province': 'Elegí tu provincia.'
};
const POSTAL_CODE_REGEX = /^[A-Za-z]?(\d{4})[A-Za-z]{0,3}$/;

const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const cartBadge = document.getElementById('cart-badge');
const cartItemsContainer = document.getElementById('cart-items');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

function toggleCart(forceState = null) {
    // Ignorar objetos de eventos
    if (typeof forceState !== 'boolean' && forceState !== null) {
        forceState = null;
    }

    if (forceState === true) {
        if (typeof goToLayer === 'function') goToLayer('#carrito');
        if (!isCartOpen) _openCart();
    } else if (forceState === false) {
        if (isCartOpen) _closeCart();
    } else {
        // Toggle manual
        if (isCartOpen) {
            _closeCart();
            if (typeof goToLayer === 'function') goToLayer('');
            else if (window.location.hash === '#carrito') {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        } else {
            if (typeof goToLayer === 'function') goToLayer('#carrito');
            else if (window.location.hash !== '#carrito') {
                window.history.pushState(null, '', '#carrito');
            }
            _openCart();
        }
    }
}

function closeCartLayer() {
    if (isCartOpen) _closeCart();
}

window.closeCartLayer = closeCartLayer;

function _openCart() {
    if (typeof dismissAllOverlays === 'function') dismissAllOverlays({ keepCart: true });
    isCartOpen = true;
    document.body.classList.add('cart-open');
    cartOverlay.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => {
        cartOverlay.classList.remove('opacity-0');
        cartOverlay.classList.add('opacity-100');
        cartDrawer.classList.remove('translate-x-full');
    }, 10);
    if (typeof lockPageScroll === 'function') lockPageScroll();
}

function _closeCart() {
    isCartOpen = false;
    document.body.classList.remove('cart-open');
    cartOverlay.classList.add('pointer-events-none');
    cartDrawer.classList.add('translate-x-full');
    cartOverlay.classList.remove('opacity-100');
    cartOverlay.classList.add('opacity-0');
    setTimeout(() => {
        cartOverlay.classList.add('hidden');
        if (typeof unlockPageScrollIfNoOverlay === 'function') unlockPageScrollIfNoOverlay();
    }, 200);
}

function addToCart(bookId = null) {
    const selectedProduct = (bookId && typeof getBookById === 'function' ? getBookById(bookId) : null)
        || (typeof getSelectedBook === 'function' ? getSelectedBook() : productInfo);
    if (!selectedProduct?.available && selectedProduct?.available !== undefined) {
        showToast('Este libro estará disponible próximamente.');
        return;
    }
    const cartProduct = {
        id: selectedProduct.id,
        title: selectedProduct.title,
        price: selectedProduct.price,
        image: selectedProduct.image,
        volume: 'Libro físico',
        format: selectedProduct.meta?.format || 'Libro físico',
        pages: selectedProduct.meta?.pages || ''
    };
    const existingItem = cart.find(item => item.id === cartProduct.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...cartProduct, quantity: 1 });
    }

    resetShippingQuote();
    updateCartUI();
    showToast("¡Libro agregado al carrito!");
    toggleCart(true);
}

function addToCartWithQty(bookId = null) {
    const qtyEl = document.getElementById('product-qty');
    const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;
    const selectedProduct = (bookId && typeof getBookById === 'function' ? getBookById(bookId) : null)
        || (typeof getSelectedBook === 'function' ? getSelectedBook() : productInfo);
    if (!selectedProduct?.available && selectedProduct?.available !== undefined) {
        showToast('Este libro estará disponible próximamente.');
        return;
    }
    const cartProduct = {
        id: selectedProduct.id,
        title: selectedProduct.title,
        price: selectedProduct.price,
        image: selectedProduct.image,
        volume: 'Libro físico',
        format: selectedProduct.meta?.format || 'Libro físico',
        pages: selectedProduct.meta?.pages || ''
    };
    const existingItem = cart.find(item => item.id === cartProduct.id);
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({ ...cartProduct, quantity: qty });
    }

    resetShippingQuote();
    updateCartUI();
    if(qtyEl) qtyEl.textContent = '1'; // reset
    showToast("¡Libro agregado al carrito!");
    toggleCart(true);
}

// Validación visual en tiempo real
function loadStoredCart() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed)) return;
        cart = parsed
            .map(item => ({
                id: String(item.id || ''),
                title: String(item.title || 'Libro'),
                price: Number(item.price) || 0,
                image: String(item.image || ''),
                volume: /^vol(?:umen)?\.?\s*\d+/i.test(String(item.volume || ''))
                    ? 'Libro físico'
                    : String(item.volume || 'Libro físico'),
                format: String(item.format || 'Tapa blanda'),
                pages: String(item.pages || ''),
                quantity: Math.max(1, Math.trunc(Number(item.quantity) || 1))
            }))
            .filter(item => item.id && item.price > 0);
    } catch (error) {
        cart = [];
    }
}

function persistCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        // Modo privado o cuota llena: el carrito sigue en memoria.
    }
}

function validateInput(el) {
    clearCheckoutMessage();
    clearFieldError(el);
    const inCheckout = Boolean(el.closest('#checkout-form'));
    if (inCheckout) {
        el.classList.remove('border-green-400', 'bg-green-50/30', 'border-red-400', 'bg-red-50/30', 'border-white');
        if (el.value.trim() !== '' && !el.checkValidity()) {
            el.classList.add('border-red-400');
        }
        return;
    }
    if (el.value.trim() === '') {
        el.classList.remove('border-green-400', 'bg-green-50/30', 'border-red-400', 'bg-red-50/30');
        el.classList.add('border-white', 'bg-white');
    } else if (el.checkValidity()) {
        el.classList.remove('border-white', 'border-red-400', 'bg-red-50/30');
        el.classList.add('border-green-400', 'bg-green-50/30');
    } else {
        el.classList.remove('border-white', 'border-green-400', 'bg-green-50/30');
        el.classList.add('border-red-400', 'bg-red-50/30');
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    resetShippingQuote();
    updateCartUI();
}

function updateItemQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        resetShippingQuote();
        updateCartUI();
    }
}

function showCheckoutMessage(message, type = 'error', options = {}) {
    if (typeof showUserMessage === 'function') {
        showUserMessage(message, type, { target: 'checkout-message', ...options });
        return;
    }
    showToast(message, type);
}

function clearCheckoutMessage() {
    if (typeof hideUserMessage === 'function') {
        hideUserMessage('checkout-message');
    }
}

function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('border-red-400', 'bg-red-50/30', 'ring-2', 'ring-red-100');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    if (field.id) document.querySelector(`[data-error-for="${field.id}"]`)?.remove();
}

function clearAllFieldErrors() {
    document.querySelectorAll('#checkout-form [data-error-for]').forEach(error => error.remove());
    document.querySelectorAll('#checkout-form [aria-invalid]').forEach(field => {
        field.classList.remove('border-red-400', 'bg-red-50/30', 'ring-2', 'ring-red-100');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
    });
}

// Muestra el motivo debajo del campo (o de su fila, si comparte fila con otro).
function showFieldError(field, message) {
    if (!field) return;
    markFieldError(field);
    field.setAttribute('aria-invalid', 'true');
    const anchor = field.closest('.checkout-field-grid, .checkout-input-icon-wrap, .checkout-privacy-wrap') || field;
    let error = document.querySelector(`[data-error-for="${field.id}"]`);
    if (!error) {
        error = document.createElement('p');
        error.className = 'checkout-field-error';
        error.dataset.errorFor = field.id;
        error.id = `error-${field.id}`;
        error.setAttribute('role', 'alert');
        // Dos campos de la misma fila comparten lugar: el segundo error va despues del primero.
        let previous = anchor;
        while (previous.nextElementSibling?.classList.contains('checkout-field-error')) previous = previous.nextElementSibling;
        previous.after(error);
    }
    error.textContent = message;
    field.setAttribute('aria-describedby', error.id);
}

function markFieldError(field) {
    if (!field) return;
    field.classList.remove('border-white', 'border-green-400', 'bg-green-50/30');
    field.classList.add('border-red-400', 'bg-red-50/30', 'ring-2', 'ring-red-100');
}

function markMissingFields(fieldIds) {
    let firstMissing = null;
    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;
        if (field.value.trim() === '') {
            showFieldError(field, MISSING_FIELD_MESSAGES[id] || 'Completá este dato.');
            if (!firstMissing) firstMissing = field;
        } else {
            clearFieldError(field);
        }
    });
    if (firstMissing) focusField(firstMissing);
}

function focusField(field) {
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus({ preventScroll: true });
}

function highlightShippingCard() {
    const card = document.getElementById('shipping-quote-card');
    if (!card) return;
    card.classList.add('ring-2', 'ring-brand-lilac/40', 'border-brand-lilac', 'bg-brand-pink/10');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
        card.classList.remove('ring-2', 'ring-brand-lilac/40');
    }, 1800);
}

function getCheckoutRequiredFields() {
    return [
        { id: 'customer-name', label: 'nombre' },
        { id: 'customer-lastname', label: 'apellido' },
        { id: 'customer-dni', label: 'DNI' },
        { id: 'customer-phone', label: 'telefono' },
        { id: 'customer-email', label: 'email' },
        { id: 'zip', label: 'codigo postal' },
        { id: 'province', label: 'provincia' },
        { id: 'city', label: 'localidad' },
        { id: 'street', label: 'calle' },
        { id: 'street-number', label: 'numero' }
    ];
}

function getMissingRequiredFields(fields = getCheckoutRequiredFields()) {
    return fields.filter(field => {
        const element = document.getElementById(field.id);
        return !element || element.value.trim() === '';
    });
}

function getCartSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function formatMoney(value) {
    return '$' + Number(value || 0).toLocaleString('es-AR');
}

function formatCheckoutMoney(value) {
    return '$ ' + Number(value || 0).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function selectCheckoutPayment(method) {
    const box = document.querySelector('.checkout-payment-box');
    const input = document.getElementById('payment-method-input');
    if (box) box.dataset.method = method === 'transfer' ? 'transfer' : 'mp';
    if (input) input.value = 'mp';
}

window.selectCheckoutPayment = selectCheckoutPayment;

// Acepta "1414" o el formato CPA ("C1414ABC") y se queda con los 4 numeros.
function normalizePostalCode(value) {
    const raw = String(value || '').trim();
    const match = raw.match(POSTAL_CODE_REGEX);
    return match ? match[1] : raw;
}

function isShippingAddressComplete(address = getShippingAddress()) {
    return /^\d{4}$/.test(address.postalCode) &&
        Boolean(address.province) &&
        address.city.length >= 2 &&
        address.street.length >= 2 &&
        Boolean(address.number);
}

function getShippingAddress() {
    return {
        postalCode: normalizePostalCode(document.getElementById('zip')?.value),
        province: document.getElementById('province')?.value.trim() || '',
        city: document.getElementById('city')?.value.trim() || '',
        street: document.getElementById('street')?.value.trim() || '',
        number: document.getElementById('street-number')?.value.trim() || '',
        apartment: document.getElementById('apartment')?.value.trim() || ''
    };
}

function buildAddressKey(address = getShippingAddress()) {
    return [
        address.postalCode,
        address.province,
        address.city,
        address.street,
        address.number,
        address.apartment
    ].map(value => String(value || '').trim().toLowerCase()).join('|');
}

function buildCartKey() {
    return cart
        .map(item => `${item.id || item.title}:${Number(item.quantity || 0)}`)
        .sort()
        .join('|');
}

function updateCheckoutSummary() {
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');
    const itemsEl = document.getElementById('checkout-items');
    const itemCountEl = document.getElementById('checkout-item-count');
    const headerCountEl = document.getElementById('checkout-header-cart-count');
    if (!subtotalEl || !shippingEl || !totalEl) return;

    const subtotal = getCartSubtotal();
    const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    subtotalEl.textContent = formatCheckoutMoney(subtotal);
    shippingEl.classList.remove('is-free');
    if (quotedShippingCost > 0) {
        shippingEl.textContent = formatCheckoutMoney(quotedShippingCost);
    } else {
        shippingEl.textContent = 'Por calcular';
    }
    totalEl.textContent = formatCheckoutMoney(subtotal + quotedShippingCost);

    if (itemCountEl) {
        itemCountEl.textContent = `${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`;
    }
    if (headerCountEl) headerCountEl.textContent = totalItems;

    if (itemsEl) {
        itemsEl.innerHTML = cart.map(item => `
            <div class="checkout-summary-item">
                <div class="checkout-summary-thumb">
                    <img src="${item.image}" alt="" loading="lazy">
                    <span>${item.quantity}</span>
                </div>
                <div class="checkout-summary-item-copy">
                    <strong>${item.title}</strong>
                    <span>${item.volume || 'Libro físico'}</span>
                    <span>${item.format || 'Tapa blanda'}${item.pages ? ` · ${item.pages} páginas` : ''}</span>
                </div>
                <div class="checkout-summary-price-col">
                    <strong class="checkout-summary-price">${formatCheckoutMoney(item.price * item.quantity)}</strong>
                </div>
            </div>
        `).join('');
    }
}

function showMercadoPagoRedirect() {
    const overlay = document.getElementById('mp-redirect-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    if (typeof lockPageScroll === 'function') lockPageScroll();
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: overlay });
}

function hideMercadoPagoRedirect() {
    const overlay = document.getElementById('mp-redirect-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    if (typeof unlockPageScrollIfNoOverlay === 'function') unlockPageScrollIfNoOverlay();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.classList.remove('hidden');
    } else {
        cartBadge.classList.add('hidden');
    }

    if (cart.length === 0) {
        cartDrawer.classList.remove('cart-has-items');
        emptyCartMsg.classList.remove('hidden');
        checkoutBtn.disabled = true;
        cartTotalEl.textContent = '$0';
        const itemDivs = cartItemsContainer.querySelectorAll('.cart-item-row');
        itemDivs.forEach(div => div.remove());
    } else {
        cartDrawer.classList.add('cart-has-items');
        emptyCartMsg.classList.add('hidden');
        checkoutBtn.disabled = false;

        const itemDivs = cartItemsContainer.querySelectorAll('.cart-item-row');
        itemDivs.forEach(div => div.remove());

        let totalPrice = 0;

        cart.forEach(item => {
            totalPrice += item.price * item.quantity;
            const itemHTML = `
                <div class="cart-item-row cart-item-editorial grid grid-cols-[6.25rem_1fr] gap-4 p-4 rounded-2xl relative">
                    <div class="cart-book-thumb w-24 h-32 flex items-center justify-center rounded-xl p-1.5 overflow-hidden shrink-0">
                        <img src="${item.image}" class="w-full h-full object-contain drop-shadow-md" onerror="this.onerror=null;this.src='assets/images/libro-comunicar-portada.webp'">
                    </div>
                    <div class="min-w-0 pr-5 flex flex-col justify-between">
                        <div>
                            <span class="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-lilac">${item.volume || 'Libro'}</span>
                            <h4 class="font-serif font-bold text-brand-text text-lg leading-tight mt-1">${item.title}</h4>
                            <p class="text-brand-text/55 text-xs mt-1">${item.format || 'Libro físico'}${item.pages ? ` · ${item.pages} páginas` : ''}</p>
                            ${typeof getBookById === 'function' && getBookById(item.id)?.listPrice > item.price
                                ? '<p class="price-web-note">Precio exclusivo web</p>'
                                : ''}
                        </div>
                        <div class="flex items-end justify-between gap-3 mt-4">
                            <div class="inline-flex items-center gap-2 rounded-full bg-brand-cream/70 border border-brand-lilac/15 p-1">
                                <button onclick="updateItemQuantity('${item.id}', -1)" class="cart-qty-btn w-7 h-7 rounded-xl flex items-center justify-center transition text-lg font-bold">-</button>
                                <span class="text-sm font-bold w-7 text-center text-brand-text">${item.quantity}</span>
                                <button onclick="updateItemQuantity('${item.id}', 1)" class="cart-qty-btn w-7 h-7 rounded-xl flex items-center justify-center transition text-lg font-bold">+</button>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] uppercase tracking-[0.16em] font-bold text-brand-text/45">Total</p>
                                <p class="cart-line-total font-bold text-base">$${(item.price * item.quantity).toLocaleString('es-AR')}</p>
                            </div>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-brand-text/35 hover:text-red-500 p-1 absolute top-3 right-3 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        cartTotalEl.textContent = '$' + totalPrice.toLocaleString('es-AR');
        lucide.createIcons();
    }

    persistCart();
    updateCheckoutSummary();

    const checkoutOpen = document.body.classList.contains('checkout-active');
    if (checkoutOpen && cart.length === 0 && typeof leaveCheckoutPage === 'function') {
        leaveCheckoutPage();
        showToast('El carrito quedó vacío. Agregá un libro para pagar.', 'warning');
    }
}

function renderCheckoutPage() {
    const container = document.getElementById('checkout-page-content');
    if (!container || typeof modalData === 'undefined') return false;
    container.innerHTML = modalData.checkout.content;
    resetShippingQuote();
    updateCheckoutSummary();
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
    return true;
}

function openCheckoutPage({ pushState = true } = {}) {
    if (!cart.length || !renderCheckoutPage()) return;
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) toastContainer.replaceChildren();
    if (typeof dismissAllOverlays === 'function') dismissAllOverlays();
    else closeCartLayer();
    if (pushState) {
        if (typeof goToLayer === 'function') goToLayer('#checkout');
        else if (window.location.hash !== '#checkout') window.history.pushState(null, '', '#checkout');
    }
    showPage('checkout-view');
}

function leaveCheckoutPage() {
    if (typeof dismissAllOverlays === 'function') dismissAllOverlays();
    else closeCartLayer();
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) toastContainer.replaceChildren();
    if (typeof goToLayer === 'function') goToLayer('');
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
    showPage('home-view');
}

function focusCheckoutSummary() {
    const summary = document.querySelector('#checkout-form .checkout-summary');
    if (summary) summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openCheckoutModal() {
    openCheckoutPage();
}

window.openCheckoutPage = openCheckoutPage;
window.leaveCheckoutPage = leaveCheckoutPage;
window.focusCheckoutSummary = focusCheckoutSummary;

function toggleShippingFields(show) {
    // Ya no es necesario el toggle complejo ya que solo existe Envío
    const fields = document.getElementById('shipping-fields');
    if (fields) fields.classList.remove('hidden');
}

function resetShippingQuote() {
    clearTimeout(shippingQuoteTimer);
    shippingQuoteRequestId += 1;
    quotedShippingCost = 0;
    quotedShippingQuote = null;
    quotedShippingAddressKey = '';
    quotedShippingCartKey = '';
    const display = document.getElementById('shipping-cost-display');
    if (display) display.innerHTML = 'El envío se calcula solo cuando completás la dirección.';
    const btn = document.getElementById('btn-calc-shipping');
    if (btn) {
        btn.innerHTML = 'Calcular envío';
        btn.disabled = false;
    }
    clearCheckoutMessage();
    updateCheckoutSummary();
}

// Cada cambio en la direccion invalida la cotizacion y, cuando queda completa, la pide sola.
function onAddressInput(field) {
    resetShippingQuote();
    validateInput(field);
    shippingQuoteTimer = setTimeout(() => {
        if (cart.length && isShippingAddressComplete()) calculateShipping(null, { silent: true });
    }, SHIPPING_AUTO_QUOTE_DELAY_MS);
}

function renderShippingQuote() {
    const display = document.getElementById('shipping-cost-display');
    if (!display || !quotedShippingQuote) return;

    const deliveryTime = quotedShippingQuote.delivery_time;
    let range = 'Plazo a confirmar por el transportista';
    if (deliveryTime?.min_days && deliveryTime?.max_days) {
        const arrival = window.DeliveryDates?.describeDeliveryRange(deliveryTime.min_days, deliveryTime.max_days);
        range = `${deliveryTime.min_days} a ${deliveryTime.max_days} días hábiles${arrival ? ` · llega ${arrival}` : ''}`;
    }
    const carrier = quotedShippingQuote.carrier_name
        ? `<div class="text-xs text-gray-500">Operado por ${escapeHtml(quotedShippingQuote.carrier_name)}</div>`
        : '';
    display.innerHTML = `
        <div class="flex items-start justify-between gap-3">
            <div>
                <div class="font-semibold text-brand-text">Envío a domicilio</div>
                <div class="text-xs text-gray-500">${escapeHtml(range)}</div>
                ${carrier}
            </div>
            <div class="text-brand-lilac font-bold">${formatMoney(quotedShippingCost)}</div>
        </div>
    `;
}

async function calculateShipping(e, { silent = false } = {}) {
    if (e) e.preventDefault();
    const address = getShippingAddress();
    const requiredShippingFields = [
        { id: 'zip', label: 'codigo postal' },
        { id: 'province', label: 'provincia' },
        { id: 'city', label: 'localidad' },
        { id: 'street', label: 'calle' },
        { id: 'street-number', label: 'numero' }
    ];
    const missingShippingFields = getMissingRequiredFields(requiredShippingFields);
    if (missingShippingFields.length) {
        if (silent) return;
        markMissingFields(missingShippingFields.map(field => field.id));
        showCheckoutMessage(`Completá estos datos para calcular el envío: ${missingShippingFields.map(field => field.label).join(', ')}.`, 'warning');
        highlightShippingCard();
        return;
    }
    if (!/^\d{4}$/.test(address.postalCode)) {
        if (silent) return;
        showFieldError(document.getElementById('zip'), 'Ingresá tu código postal de 4 números (por ejemplo 1414).');
        focusField(document.getElementById('zip'));
        return;
    }
    if (cart.length === 0) {
        if (!silent) showCheckoutMessage('Agregá al menos un libro al carrito antes de calcular el envío.', 'warning');
        return;
    }

    const btn = document.getElementById('btn-calc-shipping');
    const display = document.getElementById('shipping-cost-display');
    const requestId = ++shippingQuoteRequestId;

    btn.innerHTML = '<i class="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent inline-block align-middle mr-1"></i> Calculando...';
    btn.disabled = true;
    display.textContent = 'Calculando el envío…';

    try {
        clearCheckoutMessage();
        const response = await fetch('/.netlify/functions/quote-shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart, address })
        });

        const data = await response.json();
        // Si la direccion o el carrito cambiaron mientras tanto, esta respuesta ya no sirve.
        if (requestId !== shippingQuoteRequestId) return;

        if (!response.ok) throw new Error(data.error || 'Error cotizando');

        quotedShippingCost = data.cost || 0;
        quotedShippingQuote = data.quote || null;
        quotedShippingAddressKey = data.addressKey || buildAddressKey(address);
        quotedShippingCartKey = data.cartKey || buildCartKey();
        renderShippingQuote();
        updateCheckoutSummary();
        btn.innerHTML = 'Calculado';
        setTimeout(() => {
            if (requestId === shippingQuoteRequestId && btn.innerHTML === 'Calculado') {
                btn.innerHTML = 'Recalcular';
                btn.disabled = false;
            }
        }, 1500);
    } catch (err) {
        if (requestId !== shippingQuoteRequestId) return;
        showCheckoutMessage(
            err.message || 'No se pudo calcular el envío. Revisá los datos de dirección e intentá nuevamente.',
            'error',
            { scroll: !silent }
        );
        quotedShippingQuote = null;
        quotedShippingAddressKey = '';
        quotedShippingCartKey = '';
        display.innerHTML = 'No se pudo calcular el envío.';
        btn.innerHTML = 'Calcular envío';
        btn.disabled = false;
        updateCheckoutSummary();
    }
}

// Devuelve los problemas del formulario, ordenados como aparecen en pantalla.
function collectCheckoutErrors() {
    const errors = [];
    const get = id => document.getElementById(id);
    const addError = (id, message) => {
        const field = get(id);
        if (field) errors.push({ field, message });
    };

    getMissingRequiredFields().forEach(field => addError(field.id, MISSING_FIELD_MESSAGES[field.id] || 'Completá este dato.'));
    const hasError = id => errors.some(error => error.field.id === id);

    const email = get('customer-email')?.value.trim() || '';
    if (!hasError('customer-email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addError('customer-email', 'Revisá el email: necesitamos una dirección válida para enviarte la confirmación.');
    }

    // Se aceptan espacios, guiones, paréntesis y "+": se limpian antes de validar.
    const phone = (get('customer-phone')?.value || '').replace(/[\s\-().+]/g, '');
    if (!hasError('customer-phone') && !/^[0-9]{10,13}$/.test(phone)) {
        addError('customer-phone', 'Revisá el teléfono: con código de área, sin 0 ni 15 (por ejemplo 1155551234).');
    }

    const dni = (get('customer-dni')?.value || '').replace(/\D/g, '');
    if (!hasError('customer-dni') && !/^\d{7,8}$/.test(dni)) {
        addError('customer-dni', 'Revisá el DNI: 7 u 8 números, sin puntos.');
    }

    if (!hasError('zip') && !/^\d{4}$/.test(getShippingAddress().postalCode)) {
        addError('zip', 'Ingresá tu código postal de 4 números (por ejemplo 1414).');
    }

    const privacy = get('privacy-policy');
    if (privacy && !privacy.checked) {
        addError('privacy-policy', 'Necesitamos que aceptes las políticas de privacidad para continuar.');
    }

    return errors.sort((a, b) =>
        a.field.compareDocumentPosition(b.field) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
}

const SUBMIT_BUTTON_HTML = '<i data-lucide="lock"></i> Pagar ahora';

function setCheckoutSubmitting(isSubmitting) {
    const btn = document.querySelector('#checkout-form button[type="submit"]');
    if (!btn) return;
    if (isSubmitting) {
        btn.innerHTML = 'Procesando... <i class="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block"></i>';
    } else {
        btn.innerHTML = SUBMIT_BUTTON_HTML;
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: btn });
    }
    btn.classList.toggle('opacity-75', isSubmitting);
    btn.classList.toggle('cursor-not-allowed', isSubmitting);
    btn.disabled = isSubmitting;
}

async function handleCheckout(e) {
    if (e) e.preventDefault();

    clearCheckoutMessage();
    clearAllFieldErrors();
    const errors = collectCheckoutErrors();
    if (errors.length) {
        errors.forEach(({ field, message }) => showFieldError(field, message));
        focusField(errors[0].field);
        return;
    }

    const customerName = `${document.getElementById('customer-name').value} ${document.getElementById('customer-lastname').value}`.trim();
    const customerPhone = document.getElementById('customer-phone').value.replace(/[\s\-().+]/g, '');
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerDni = document.getElementById('customer-dni').value.replace(/\D/g, '');
    const address = getShippingAddress();

    if (!quotedShippingQuote || quotedShippingCost <= 0) {
        showCheckoutMessage('Antes de pagar necesitamos calcular el envío a tu domicilio.', 'warning');
        highlightShippingCard();
        return;
    }
    if (quotedShippingAddressKey !== buildAddressKey(address) || quotedShippingCartKey !== buildCartKey()) {
        showCheckoutMessage('La dirección o la cantidad del carrito cambió después de calcular el envío. Recalculalo antes de pagar.', 'warning');
        highlightShippingCard();
        return;
    }

    setCheckoutSubmitting(true);

    try {
        showMercadoPagoRedirect();
        const response = await fetch('/.netlify/functions/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: cart,
                delivery: 'shipping',
                shippingQuote: quotedShippingQuote,
                addressKey: quotedShippingAddressKey,
                cartKey: quotedShippingCartKey,
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    dni: customerDni,
                    newsletter: Boolean(document.getElementById('checkout-newsletter')?.checked),
                    postalCode: address.postalCode,
                    province: address.province,
                    city: address.city,
                    street: address.street,
                    number: address.number,
                    apartment: address.apartment
                }
            })
        });
        const data = await response.json();

        if (response.ok && data.init_point) {
            window.location.href = data.init_point;
            return;
        }

        // El transportista cambió el precio desde que se mostró: se actualiza y la persona confirma de nuevo.
        if (response.status === 409 && data.code === 'SHIPPING_PRICE_CHANGED') {
            quotedShippingCost = data.shippingCost;
            quotedShippingQuote = data.quote;
            renderShippingQuote();
            updateCheckoutSummary();
            hideMercadoPagoRedirect();
            setCheckoutSubmitting(false);
            showCheckoutMessage(`${data.error} Nuevo costo de envío: ${formatMoney(data.shippingCost)}.`, 'warning');
            return;
        }

        throw new Error(data.error || 'Error en Mercado Pago');
    } catch (error) {
        console.error('Error al ejecutar fetch:', error);
        hideMercadoPagoRedirect();
        setCheckoutSubmitting(false);
        showCheckoutMessage(error.message || 'Hubo un problema al conectar con Mercado Pago. Revisá tu conexión e intentá nuevamente.', 'error');
    }
}

// Al volver con "Atrás" desde Mercado Pago el navegador restaura la página tal cual estaba.
window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    hideMercadoPagoRedirect();
    setCheckoutSubmitting(false);
});

// Despues de pagar, el carrito no tiene que seguir mostrando el libro ya comprado.
function clearCartAfterPurchase() {
    cart = [];
    persistCart();
    updateCartUI();
}
window.clearCartAfterPurchase = clearCartAfterPurchase;

function togglePaymentMethod(method) {
    // Función mantenida por compatibilidad pero vacía
}

function handleSubscribeSubmit(e) {
    const emailInput = document.getElementById('EMAIL');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validación explícita
    if (!emailInput || !emailRegex.test(emailInput.value)) {
        e.preventDefault(); // Acá SÍ cancelamos el envío porque está mal
        if (emailInput) markFieldError(emailInput);
        showToast('Ingresá un correo electrónico válido para suscribirte.', 'warning');
        return;
    }

    // Si pasamos la validación, NO hacemos preventDefault() para que el form se envíe al iframe

    const btn = document.getElementById('subs-btn');
    const msg = document.getElementById('subs-msg');

    btn.innerHTML = 'Enviando... <i class="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block"></i>';
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    setTimeout(() => {
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Listo';
        btn.className = 'w-full bg-brand-green/20 text-brand-green py-3.5 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-brand-green/30';
        btn.disabled = true;

        msg.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }, 1500);
}

loadStoredCart();
updateCartUI();
