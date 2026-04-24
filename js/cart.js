const MAX_CART_ITEM_QUANTITY = 10;
const PHONE_REGEX = /^[0-9]{10,13}$/;
const CART_STORAGE_KEY = 'ceci_cart';
const PENDING_MP_URL_KEY = 'mpInitPoint_pendiente';
const PENDING_WPP_URL_KEY = 'whatsappUrl_pendiente';

let cart = [];
let isCartOpen = false;
let quotedShippingCost = 0;

const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const cartBadge = document.getElementById('cart-badge');
const cartItemsContainer = document.getElementById('cart-items');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

function readJsonFromStorage(key, fallbackValue) {
    try {
        const rawValue = localStorage.getItem(key);
        return rawValue ? JSON.parse(rawValue) : fallbackValue;
    } catch (error) {
        console.error('Error leyendo localStorage', { key, message: error.message });
        return fallbackValue;
    }
}

function writeJsonToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error guardando localStorage', { key, message: error.message });
    }
}

function sanitizeStoredCart(rawCart) {
    if (!Array.isArray(rawCart)) {
        return [];
    }

    return rawCart
        .map((item) => {
            const quantity = Number(item?.quantity);
            const productId = item?.id || item?.productId;

            if (productId !== productInfo.id || !Number.isInteger(quantity) || quantity <= 0) {
                return null;
            }

            return {
                ...productInfo,
                quantity: Math.min(quantity, MAX_CART_ITEM_QUANTITY),
            };
        })
        .filter(Boolean);
}

function persistCart() {
    const serializedCart = cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
    }));
    writeJsonToStorage(CART_STORAGE_KEY, serializedCart);
}

function loadCartFromStorage() {
    cart = sanitizeStoredCart(readJsonFromStorage(CART_STORAGE_KEY, []));
}

function clearCart() {
    cart = [];
    persistCart();
    updateCartUI();
}

function toggleCart(forceState = null) {
    if (typeof forceState !== 'boolean' && forceState !== null) {
        forceState = null;
    }

    if (forceState === true) {
        if (!isCartOpen) _openCart();
    } else if (forceState === false) {
        if (isCartOpen) _closeCart();
    } else if (isCartOpen) {
        if (window.location.hash === '#carrito') {
            window.history.back();
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

function _openCart() {
    isCartOpen = true;
    cartOverlay.classList.remove('hidden');
    setTimeout(() => {
        cartOverlay.classList.remove('opacity-0');
        cartOverlay.classList.add('opacity-100');
        cartDrawer.classList.remove('translate-x-full');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function _closeCart() {
    isCartOpen = false;
    cartDrawer.classList.add('translate-x-full');
    cartOverlay.classList.remove('opacity-100');
    cartOverlay.classList.add('opacity-0');
    setTimeout(() => {
        cartOverlay.classList.add('hidden');
    }, 200);

    if (!document.getElementById('action-modal') || document.getElementById('action-modal').classList.contains('pointer-events-none')) {
        document.body.style.overflow = 'auto';
    }
}

function addProductQuantity(quantityToAdd) {
    const quantity = Number(quantityToAdd);
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return;
    }

    const existingItem = cart.find((item) => item.id === productInfo.id);
    if (existingItem) {
        const nextQuantity = Math.min(existingItem.quantity + quantity, MAX_CART_ITEM_QUANTITY);
        if (nextQuantity === existingItem.quantity) {
            showToast(`Máximo ${MAX_CART_ITEM_QUANTITY} unidades por compra.`, 'info');
            return;
        }

        existingItem.quantity = nextQuantity;
    } else {
        cart.push({
            ...productInfo,
            quantity: Math.min(quantity, MAX_CART_ITEM_QUANTITY),
        });
    }

    updateCartUI();
    showToast('¡Libro agregado al carrito!');
    toggleCart(true);
}

function addToCart() {
    addProductQuantity(1);
}

function addToCartWithQty() {
    const qtyEl = document.getElementById('product-qty');
    const qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;

    addProductQuantity(qty);

    if (qtyEl) {
        qtyEl.textContent = '1';
    }
}

function validateInput(el) {
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
    cart = cart.filter((item) => item.id !== id);
    updateCartUI();
}

function updateItemQuantity(id, change) {
    const item = cart.find((cartItem) => cartItem.id === id);
    if (!item) {
        return;
    }

    const nextQuantity = item.quantity + change;
    if (nextQuantity <= 0) {
        cart = cart.filter((cartItem) => cartItem.id !== id);
    } else if (nextQuantity > MAX_CART_ITEM_QUANTITY) {
        showToast(`Máximo ${MAX_CART_ITEM_QUANTITY} unidades por compra.`, 'info');
        return;
    } else {
        item.quantity = nextQuantity;
    }

    updateCartUI();
}

function createQuantityButton(label, itemId, change) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = 'update-cart-item';
    button.dataset.id = itemId;
    button.dataset.change = String(change);
    button.className = 'w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-brand-lilac hover:text-white flex items-center justify-center transition text-lg font-bold';
    button.textContent = label;
    return button;
}

function createCartItemRow(item) {
    const row = document.createElement('div');
    row.className = 'cart-item-row flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'w-16 h-24 bg-brand-light flex items-center justify-center rounded-lg p-1 overflow-hidden shrink-0';

    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.title;
    image.className = 'w-full h-full object-contain';
    image.addEventListener('error', () => {
        image.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop';
    }, { once: true });
    imageWrapper.append(image);

    const content = document.createElement('div');
    content.className = 'flex-grow';

    const title = document.createElement('h4');
    title.className = 'font-medium text-brand-text text-sm leading-tight mb-1';
    title.textContent = item.title;

    const price = document.createElement('p');
    price.className = 'text-brand-lilac font-bold';
    price.textContent = `$${item.price.toLocaleString('es-AR')}`;

    const qtyControls = document.createElement('div');
    qtyControls.className = 'flex items-center gap-2 mt-2';
    qtyControls.append(
        createQuantityButton('-', item.id, -1),
        Object.assign(document.createElement('span'), {
            className: 'text-sm font-medium w-6 text-center',
            textContent: String(item.quantity),
        }),
        createQuantityButton('+', item.id, 1),
    );

    content.append(title, price, qtyControls);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.dataset.action = 'remove-cart-item';
    removeButton.dataset.id = item.id;
    removeButton.className = 'text-gray-400 hover:text-red-500 p-1 absolute top-2 right-2 transition';
    removeButton.append(createLucideIcon('trash-2', 'w-4 h-4'));

    row.append(imageWrapper, content, removeButton);
    return row;
}

function setShippingDisplay(text, highlighted = false) {
    const display = document.getElementById('shipping-cost-display');
    if (!display) {
        return;
    }

    display.textContent = text;
    display.className = highlighted
        ? 'text-sm font-bold text-brand-lilac'
        : 'text-sm font-medium text-gray-600';
}

function setButtonLoadingState(button, label, iconName, isLoading, iconClass = 'w-4 h-4') {
    if (!button) {
        return;
    }

    button.disabled = isLoading;

    if (isLoading) {
        const spinner = document.createElement('i');
        spinner.className = 'animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block';
        if (button.id === 'btn-calc-shipping') {
            spinner.className = 'animate-spin w-4 h-4 rounded-full border-2 border-brand-lilac border-t-transparent inline-block';
        }
        setElementChildren(button, [spinner]);
    } else if (iconName) {
        setElementChildren(button, [document.createTextNode(label), createLucideIcon(iconName, iconClass)]);
        lucide.createIcons({ root: button });
    } else {
        button.textContent = label;
    }
}

function updateCartUI() {
    persistCart();

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.classList.remove('hidden');
    } else {
        cartBadge.classList.add('hidden');
    }

    cartItemsContainer.querySelectorAll('.cart-item-row').forEach((item) => item.remove());

    if (cart.length === 0) {
        emptyCartMsg.classList.remove('hidden');
        checkoutBtn.disabled = true;
        cartTotalEl.textContent = '$0';
        return;
    }

    emptyCartMsg.classList.add('hidden');
    checkoutBtn.disabled = false;

    let totalPrice = 0;
    cart.forEach((item) => {
        totalPrice += item.price * item.quantity;
        cartItemsContainer.append(createCartItemRow(item));
    });

    cartTotalEl.textContent = `$${totalPrice.toLocaleString('es-AR')}`;
    lucide.createIcons({ root: cartItemsContainer });
}

function openCheckoutModal() {
    toggleCart();
    setTimeout(() => {
        openModal('checkout');
    }, 300);
}

function toggleShippingFields(show) {
    const fields = document.getElementById('shipping-fields');
    const cashLabel = document.getElementById('label-cash');
    const cashInput = document.querySelector('input[name="payment"][value="cash"]');
    const mpInput = document.querySelector('input[name="payment"][value="mp"]');

    if (show) {
        fields.classList.remove('hidden');
        document.getElementById('address').required = true;
        document.getElementById('city').required = true;
        document.getElementById('zip').required = true;
        document.getElementById('province').required = true;

        if (cashLabel) cashLabel.classList.add('hidden');
        if (cashInput && cashInput.checked) {
            cashInput.checked = false;
            if (mpInput) {
                mpInput.checked = true;
                togglePaymentMethod('mp');
            }
        }
    } else {
        fields.classList.add('hidden');
        document.getElementById('address').required = false;
        document.getElementById('city').required = false;
        document.getElementById('zip').required = false;
        document.getElementById('province').required = false;

        if (cashLabel) cashLabel.classList.remove('hidden');
    }
}

function getShippingErrorElement() {
    return document.getElementById('shipping-error-message');
}

function setShippingError(message) {
    const errorEl = getShippingErrorElement();
    if (!errorEl) {
        return;
    }

    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function clearShippingError() {
    const errorEl = getShippingErrorElement();
    if (!errorEl) {
        return;
    }

    errorEl.textContent = '';
    errorEl.classList.add('hidden');
}

function resetShippingQuote() {
    quotedShippingCost = 0;
    clearShippingError();
    setShippingDisplay('Por cotizar...');
}

async function calculateShipping(e) {
    e.preventDefault();
    clearShippingError();

    const zipCode = document.getElementById('zip').value;
    if (!zipCode || zipCode.trim() === '') {
        setShippingError('Ingresá un código postal para cotizar el envío.');
        return;
    }

    const btn = document.getElementById('btn-calc-shipping');
    setButtonLoadingState(btn, '', '', true);

    try {
        const response = await fetch('/.netlify/functions/quote-shipping', {
            method: 'POST',
            body: JSON.stringify({ zip_dest: zipCode }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'No se pudo cotizar el envío para ese código postal.');
        }

        quotedShippingCost = data.cost || 0;
        setShippingDisplay(`$${quotedShippingCost.toLocaleString('es-AR')} ARS`, true);
        btn.textContent = 'Cotizado ✓';
    } catch (err) {
        quotedShippingCost = 0;
        setShippingError(err.message || 'No pudimos cotizar el envío. Revisá el código postal e intentá nuevamente.');
        setShippingDisplay('Por cotizar...');
        btn.textContent = 'Cotizar Envío';
        btn.disabled = false;
    } finally {
        setTimeout(() => {
            if (btn.textContent === 'Cotizado ✓') {
                btn.textContent = 'Recotizar';
                btn.disabled = false;
            }
        }, 2000);
    }
}

function setCheckoutButtonState(button, originalText, isLoading) {
    if (!button) {
        return;
    }

    button.disabled = isLoading;

    if (isLoading) {
        const spinner = document.createElement('i');
        spinner.className = 'animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block';
        setElementChildren(button, [document.createTextNode('Procesando... '), spinner]);
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        setElementChildren(button, [document.createTextNode(originalText), createLucideIcon('check', 'w-4 h-4')]);
        lucide.createIcons({ root: button });
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

function buildCheckoutCartPayload() {
    return cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
    }));
}

function buildPendingWhatsappUrl(message) {
    return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

async function handleCheckout(e) {
    if (e) {
        e.preventDefault();
    }

    const form = e?.target;
    const btn = e?.submitter || form?.querySelector('button[type="submit"]');
    const originalText = btn ? btn.childNodes[0]?.textContent?.trim() || 'Confirmar Pedido' : '';

    if (btn?.disabled) {
        return;
    }

    setCheckoutButtonState(btn, originalText, true);
    const restoreButton = () => setCheckoutButtonState(btn, originalText, false);

    if (cart.length === 0) {
        restoreButton();
        alert('Tu carrito está vacío.');
        return;
    }

    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerDni = document.getElementById('customer-dni').value.trim();
    const delivery = document.querySelector('input[name="delivery"]:checked').value;
    const payment = document.querySelector('input[name="payment"]:checked').value;

    if (!PHONE_REGEX.test(customerPhone.replace(/\s/g, ''))) {
        restoreButton();
        alert('Por favor, ingresa un número de teléfono válido (solo números, código de área sin 0 ni 15).');
        return;
    }

    const privacyCheck = document.getElementById('privacy-policy');
    if (privacyCheck && !privacyCheck.checked) {
        restoreButton();
        alert('Debes aceptar las Políticas de Privacidad para continuar con tu compra.');
        return;
    }

    if (delivery === 'shipping' && quotedShippingCost === 0) {
        restoreButton();
        alert("Por favor, hacé clic en 'Cotizar Envío' antes de proceder al pago.");
        return;
    }

    let itemsList = '';
    let totalPrice = 0;

    cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        itemsList += `• ${item.title} x${item.quantity}: $${itemTotal.toLocaleString('es-AR')}\n`;
    });

    const address = document.getElementById('address') ? document.getElementById('address').value.trim() : '';
    const city = document.getElementById('city') ? document.getElementById('city').value.trim() : '';
    const zip = document.getElementById('zip') ? document.getElementById('zip').value.trim() : '';
    const province = document.getElementById('province') ? document.getElementById('province').value.trim() : '';

    const deliveryInfo = delivery === 'pickup'
        ? '📍 Retiro en persona (Zona Norte, GBA)'
        : `📦 Envío a:\n${address}, ${city} (${zip}), ${province}`;

    const paymentInfo = payment === 'cash'
        ? '💵 Efectivo al retirar'
        : payment === 'mp'
            ? '💳 Mercado Pago'
            : '💬 WhatsApp';

    const message = `🛒 *Nuevo Pedido - Libro "${SITE_CONFIG.bookTitle}"*\n\n` +
        `👤 *Cliente:* ${customerName}\n` +
        `📱 *Teléfono:* ${customerPhone}\n\n` +
        `📚 *Productos:*\n${itemsList}\n` +
        `💰 *Total:* $${totalPrice.toLocaleString('es-AR')} ARS\n\n` +
        `🚚 *Entrega:*\n${deliveryInfo}\n\n` +
        `💳 *Pago:* ${paymentInfo}\n\n` +
        `¡Gracias por tu compra!`;

    const whatsappUrl = buildPendingWhatsappUrl(message);

    if (payment === 'mp') {
        localStorage.setItem(PENDING_WPP_URL_KEY, whatsappUrl);

        try {
            const response = await fetch('/.netlify/functions/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cart: buildCheckoutCartPayload(),
                    delivery,
                    customer: {
                        name: customerName,
                        phone: customerPhone,
                        email: customerEmail,
                        dni: customerDni,
                        address,
                        city,
                        zip,
                        province,
                    },
                }),
            });
            const data = await response.json();

            if (response.ok && data.init_point) {
                localStorage.setItem(PENDING_MP_URL_KEY, data.init_point);
                closeModal();

                if (typeof setPaymentStatusView === 'function') {
                    setPaymentStatusView('redirecting', { initPoint: data.init_point });
                }
                showPage('success-view');
                window.open(data.init_point, '_blank');
                restoreButton();
            } else {
                console.error('Error de MP:', data);
                restoreButton();
                alert(`Hubo un problema al conectar con Mercado Pago: ${data.error || 'Asegúrate de que el token sea válido.'}`);
            }
        } catch (error) {
            console.error('Error al ejecutar fetch:', error);
            restoreButton();
            alert('Error de conexión con el servidor. Intenta nuevamente.');
        }

        return;
    }

    window.open(whatsappUrl, '_blank');
    clearCart();
    closeModal();
    if (typeof setPaymentStatusView === 'function') {
        setPaymentStatusView('cash');
    }
    showPage('success-view');
    restoreButton();
}

function togglePaymentMethod(method) {
    const detailsDiv = document.getElementById('payment-details');
    const instructions = document.getElementById('payment-instructions');
    if (!detailsDiv || !instructions) return;

    if (method === 'cash') {
        instructions.textContent = '💵 El pago se realizará en efectivo cuando retires el libro. Luego de confirmar nos contactaremos.';
        detailsDiv.classList.remove('hidden');
    } else if (method === 'mp') {
        instructions.textContent = '💳 Serás redirigido a Mercado Pago para abonar de forma segura en una nueva pestaña.';
        detailsDiv.classList.remove('hidden');
    } else {
        detailsDiv.classList.add('hidden');
    }
}

function handleSubscribeSubmit(e) {
    const emailInput = document.getElementById('EMAIL');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailInput || !emailRegex.test(emailInput.value)) {
        e.preventDefault();
        alert('Por favor, ingresa un correo electrónico válido para suscribirte.');
        return;
    }

    const btn = document.getElementById('subs-btn');
    const msg = document.getElementById('subs-msg');

    setButtonLoadingState(btn, 'Enviando...', '', true);
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    setTimeout(() => {
        btn.className = 'w-full bg-brand-green/20 text-brand-green py-3.5 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-brand-green/30';
        btn.disabled = true;
        setElementChildren(btn, [createLucideIcon('check', 'w-4 h-4'), document.createTextNode(' Listo')]);
        lucide.createIcons({ root: btn });
        msg.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }, 1500);
}

document.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) {
        return;
    }

    if (actionTarget.dataset.action === 'update-cart-item') {
        updateItemQuantity(actionTarget.dataset.id, Number(actionTarget.dataset.change || '0'));
    }

    if (actionTarget.dataset.action === 'remove-cart-item') {
        removeFromCart(actionTarget.dataset.id);
    }
});

loadCartFromStorage();
updateCartUI();
