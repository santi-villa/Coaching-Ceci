let cart = [];
let isCartOpen = false;
let quotedShippingCost = 0;
let quotedShippingQuote = null;
let quotedShippingAddressKey = '';
let quotedShippingCartKey = '';

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
        if (!isCartOpen) _openCart();
    } else if (forceState === false) {
        if (isCartOpen) _closeCart();
    } else {
        // Toggle manual
        if (isCartOpen) {
            if (window.location.hash === '#carrito') {
                window.history.back(); // Disparador para popstate
            } else {
                _closeCart();
            }
        } else {
            if (window.location.hash !== '#carrito') {
                window.history.pushState(null, '', '#carrito');
            }
            _openCart();
        }
    }
}

function _openCart() {
    isCartOpen = true;
    cartOverlay.classList.remove('hidden');
    setTimeout(() => {
        cartOverlay.classList.remove('opacity-0');
        cartOverlay.classList.add('opacity-100');
        cartDrawer.classList.remove('translate-x-full');
    }, 10);
    if (typeof lockPageScroll === 'function') lockPageScroll();
}

function _closeCart() {
    isCartOpen = false;
    cartDrawer.classList.add('translate-x-full');
    cartOverlay.classList.remove('opacity-100');
    cartOverlay.classList.add('opacity-0');
    setTimeout(() => {
        cartOverlay.classList.add('hidden');
        if (typeof unlockPageScrollIfNoOverlay === 'function') unlockPageScrollIfNoOverlay();
    }, 200);
}

function addToCart() {
    const existingItem = cart.find(item => item.id === productInfo.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...productInfo, quantity: 1 });
    }

    resetShippingQuote();
    updateCartUI();
    showToast("¡Libro agregado al carrito!");
    toggleCart(true);
}

function addToCartWithQty() {
    const qtyEl = document.getElementById('product-qty');
    const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;

    const existingItem = cart.find(item => item.id === productInfo.id);
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({ ...productInfo, quantity: qty });
    }

    resetShippingQuote();
    updateCartUI();
    if(qtyEl) qtyEl.textContent = '1'; // reset
    showToast("¡Libro agregado al carrito!");
    toggleCart(true);
}

// Validación visual en tiempo real
function validateInput(el) {
    clearCheckoutMessage();
    clearFieldError(el);
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

function showCheckoutMessage(message, type = 'error') {
    if (typeof showUserMessage === 'function') {
        showUserMessage(message, type, { target: 'checkout-message' });
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
            markFieldError(field);
            if (!firstMissing) firstMissing = field;
        } else {
            clearFieldError(field);
        }
    });
    if (firstMissing) firstMissing.focus({ preventScroll: true });
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
        { id: 'customer-name', label: 'nombre completo' },
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

function getShippingAddress() {
    return {
        postalCode: document.getElementById('zip')?.value.trim() || '',
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
    if (!subtotalEl || !shippingEl || !totalEl) return;

    const subtotal = getCartSubtotal();
    subtotalEl.textContent = formatMoney(subtotal);
    shippingEl.textContent = quotedShippingCost > 0 ? formatMoney(quotedShippingCost) : 'Por calcular';
    totalEl.textContent = formatMoney(subtotal + quotedShippingCost);
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
                        <img src="${item.image}" class="w-full h-full object-contain drop-shadow-md" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop'">
                    </div>
                    <div class="min-w-0 pr-5 flex flex-col justify-between">
                        <div>
                            <span class="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-lilac">Vol. 1</span>
                            <h4 class="font-serif font-bold text-brand-text text-lg leading-tight mt-1">${item.title}</h4>
                            <p class="text-brand-text/55 text-xs mt-1">Tapa blanda · 104 páginas</p>
                        </div>
                        <div class="flex items-end justify-between gap-3 mt-4">
                            <div class="inline-flex items-center gap-2 rounded-full bg-brand-cream/70 border border-brand-lilac/15 p-1">
                                <button onclick="updateItemQuantity('${item.id}', -1)" class="cart-qty-btn w-7 h-7 rounded-full flex items-center justify-center transition text-lg font-bold">-</button>
                                <span class="text-sm font-bold w-7 text-center text-brand-text">${item.quantity}</span>
                                <button onclick="updateItemQuantity('${item.id}', 1)" class="cart-qty-btn w-7 h-7 rounded-full flex items-center justify-center transition text-lg font-bold">+</button>
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

    updateCheckoutSummary();
}

function openCheckoutModal() {
    toggleCart();
    setTimeout(() => {
        openModal('checkout');
        resetShippingQuote();
        updateCheckoutSummary();
    }, 300);
}

function toggleShippingFields(show) {
    // Ya no es necesario el toggle complejo ya que solo existe Envío
    const fields = document.getElementById('shipping-fields');
    if (fields) fields.classList.remove('hidden');
}

function resetShippingQuote() {
    quotedShippingCost = 0;
    quotedShippingQuote = null;
    quotedShippingAddressKey = '';
    quotedShippingCartKey = '';
    const display = document.getElementById('shipping-cost-display');
    if (display) display.innerHTML = 'Completá la dirección para calcular el envío.';
    const btn = document.getElementById('btn-calc-shipping');
    if (btn) {
        btn.innerHTML = 'Calcular envío';
        btn.disabled = false;
    }
    clearCheckoutMessage();
    updateCheckoutSummary();
}

async function calculateShipping(e) {
    e.preventDefault();
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
        markMissingFields(missingShippingFields.map(field => field.id));
        showCheckoutMessage(`Completá estos datos para calcular el envío: ${missingShippingFields.map(field => field.label).join(', ')}.`, 'warning');
        highlightShippingCard();
        return;
    }
    if (cart.length === 0) {
        showCheckoutMessage('Agregá al menos un libro al carrito antes de calcular el envío.', 'warning');
        return;
    }

    const btn = document.getElementById('btn-calc-shipping');
    const display = document.getElementById('shipping-cost-display');

    btn.innerHTML = '<i class="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent inline-block align-middle mr-1"></i> Calculando...';
    btn.disabled = true;

    try {
        clearCheckoutMessage();
        const response = await fetch('/.netlify/functions/quote-shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart, address })
        });

        let data = await response.json();

        if (response.ok) {
            quotedShippingCost = data.cost || 0;
            quotedShippingQuote = data.quote || null;
            quotedShippingAddressKey = data.addressKey || buildAddressKey(address);
            quotedShippingCartKey = data.cartKey || buildCartKey();
            const deliveryTime = quotedShippingQuote?.delivery_time;
            const range = deliveryTime?.min_days && deliveryTime?.max_days
                ? `${deliveryTime.min_days} a ${deliveryTime.max_days} días hábiles`
                : 'Plazo a confirmar por el transportista';
            const carrier = quotedShippingQuote?.carrier_name
                ? `<div class="text-xs text-gray-500">Operado por ${quotedShippingQuote.carrier_name}</div>`
                : '';
            display.innerHTML = `
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="font-semibold text-brand-text">Envío a domicilio</div>
                        <div class="text-xs text-gray-500">${range}</div>
                        ${carrier}
                    </div>
                    <div class="text-brand-lilac font-bold">${formatMoney(quotedShippingCost)}</div>
                </div>
            `;
            updateCheckoutSummary();
            btn.innerHTML = 'Calculado';
        } else {
            throw new Error(data.error || 'Error cotizando');
        }
    } catch (err) {
        showCheckoutMessage(err.message || 'No se pudo calcular el envío. Revisá los datos de dirección e intentá nuevamente.', 'error');
        quotedShippingQuote = null;
        quotedShippingAddressKey = '';
        quotedShippingCartKey = '';
        display.innerHTML = 'No se pudo calcular el envío.';
        btn.innerHTML = 'Calcular envío';
        updateCheckoutSummary();
    } finally {
        setTimeout(() => { if (btn.innerHTML === 'Calculado') { btn.innerHTML = 'Recalcular'; btn.disabled = false; } }, 1500);
    }
}

async function handleCheckout(e) {
    if (e) e.preventDefault();

    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerDni = document.getElementById('customer-dni').value;
    const address = getShippingAddress();
    
    // Solo permitimos shipping y mp
    const delivery = 'shipping';
    const payment = 'mp';

    const missingFields = getMissingRequiredFields();
    if (missingFields.length) {
        markMissingFields(missingFields.map(field => field.id));
        showCheckoutMessage(`Nos falta completar: ${missingFields.map(field => field.label).join(', ')}.`, 'warning');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
        markFieldError(document.getElementById('customer-email'));
        showCheckoutMessage('Revisá el email: necesitamos una dirección válida para enviarte la confirmación.', 'warning');
        return;
    }

    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ""))) {
        markFieldError(document.getElementById('customer-phone'));
        showCheckoutMessage('Revisá el teléfono: usá solo números, con código de área, sin 0 ni 15.', 'warning');
        return;
    }

    const privacyCheck = document.getElementById('privacy-policy');
    if (privacyCheck && !privacyCheck.checked) {
        showCheckoutMessage('Para continuar necesitás aceptar las Políticas de Privacidad.', 'warning');
        return;
    }

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

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    // Efecto de carga en el botón
    btn.innerHTML = 'Procesando... <i class="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block"></i>';
    btn.classList.add('opacity-75', 'cursor-not-allowed');
    btn.disabled = true;

    try {
        clearCheckoutMessage();
        showMercadoPagoRedirect();
        const response = await fetch('/.netlify/functions/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: cart,
                delivery: delivery,
                shippingQuote: quotedShippingQuote,
                addressKey: quotedShippingAddressKey,
                cartKey: quotedShippingCartKey,
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    dni: customerDni,
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
        } else {
            throw new Error(data.error || "Error en Mercado Pago");
        }
    } catch (error) {
        console.error("Error al ejecutar fetch:", error);
        hideMercadoPagoRedirect();
        btn.innerHTML = originalText;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        btn.disabled = false;
        showCheckoutMessage(error.message || 'Hubo un problema al conectar con Mercado Pago. Revisá tu conexión e intentá nuevamente.', 'error');
    }
}

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
