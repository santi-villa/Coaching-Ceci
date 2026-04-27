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
    // Solo devolvemos a auto si el modal tampoco lo está usando
    if (!document.getElementById('action-modal') || document.getElementById('action-modal').classList.contains('pointer-events-none')) {
        document.body.style.overflow = 'auto';
    }
}

function addToCart() {
    const existingItem = cart.find(item => item.id === productInfo.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...productInfo, quantity: 1 });
    }

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

    updateCartUI();
    if(qtyEl) qtyEl.textContent = '1'; // reset
    showToast("¡Libro agregado al carrito!");
    toggleCart(true);
}

// Validación visual en tiempo real
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
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateItemQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    }
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
        emptyCartMsg.classList.remove('hidden');
        checkoutBtn.disabled = true;
        cartTotalEl.textContent = '$0';
        const itemDivs = cartItemsContainer.querySelectorAll('.cart-item-row');
        itemDivs.forEach(div => div.remove());
    } else {
        emptyCartMsg.classList.add('hidden');
        checkoutBtn.disabled = false;

        const itemDivs = cartItemsContainer.querySelectorAll('.cart-item-row');
        itemDivs.forEach(div => div.remove());

        let totalPrice = 0;

        cart.forEach(item => {
            totalPrice += item.price * item.quantity;
            const itemHTML = `
                <div class="cart-item-row flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative">
                    <div class="w-16 h-24 bg-brand-light flex items-center justify-center rounded-lg p-1 overflow-hidden shrink-0">
                        <img src="${item.image}" class="w-full h-full object-contain" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop'">
                    </div>
                    <div class="flex-grow">
                        <h4 class="font-medium text-brand-text text-sm leading-tight mb-1">${item.title}</h4>
                        <p class="text-brand-lilac font-bold">$${item.price.toLocaleString('es-AR')}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <button onclick="updateItemQuantity('${item.id}', -1)" class="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-brand-lilac hover:text-white flex items-center justify-center transition text-lg font-bold">-</button>
                            <span class="text-sm font-medium w-6 text-center">${item.quantity}</span>
                            <button onclick="updateItemQuantity('${item.id}', 1)" class="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-brand-lilac hover:text-white flex items-center justify-center transition text-lg font-bold">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-gray-400 hover:text-red-500 p-1 absolute top-2 right-2 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        cartTotalEl.textContent = '$' + totalPrice.toLocaleString('es-AR');
        lucide.createIcons();
    }
}

function openCheckoutModal() {
    toggleCart();
    setTimeout(() => {
        openModal('checkout');
    }, 300);
}

function toggleShippingFields(show) {
    // Ya no es necesario el toggle complejo ya que solo existe Envío
    const fields = document.getElementById('shipping-fields');
    if (fields) fields.classList.remove('hidden');
}

function resetShippingQuote() {
    quotedShippingCost = 0;
    const display = document.getElementById('shipping-cost-display');
    if (display) display.innerHTML = 'Por cotizar...';
}

async function calculateShipping(e) {
    e.preventDefault();
    const zipCode = document.getElementById('zip').value;
    if (!zipCode || zipCode.trim() === '') {
        alert("Por favor, ingresá el Código Postal para cotizar el envío.");
        return;
    }

    const btn = document.getElementById('btn-calc-shipping');
    const display = document.getElementById('shipping-cost-display');

    btn.innerHTML = '<i class="animate-spin w-4 h-4 rounded-full border-2 border-brand-lilac border-t-transparent inline-block"></i>';
    btn.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/quote-shipping', {
            method: 'POST',
            body: JSON.stringify({ zip_dest: zipCode })
        });

        let data = await response.json();

        if (response.ok) {
            quotedShippingCost = data.cost || 0;
            display.innerHTML = `<span class="text-sm text-gray-500 font-medium">Envío Estándar:</span> <span class="text-brand-lilac font-bold">$${quotedShippingCost.toLocaleString('es-AR')} ARS</span>`;
            btn.innerHTML = 'Cotizado ✓';
        } else {
            throw new Error(data.error || 'Error cotizando');
        }
    } catch (err) {
        alert("Error al cotizar código postal. Revisa que sea válido.");
        display.innerHTML = 'Por cotizar...';
        btn.innerHTML = 'Cotizar Envío';
    } finally {
        setTimeout(() => { if (btn.innerHTML === 'Cotizado ✓') { btn.innerHTML = 'Recotizar'; btn.disabled = false; } }, 2000);
    }
}

async function handleCheckout(e) {
    if (e) e.preventDefault();

    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerDni = document.getElementById('customer-dni').value;
    
    // Solo permitimos shipping y mp
    const delivery = 'shipping';
    const payment = 'mp';

    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ""))) {
        alert("Por favor, ingresa un número de teléfono válido (solo números, código de área sin 0 ni 15).");
        return;
    }

    const privacyCheck = document.getElementById('privacy-policy');
    if (privacyCheck && !privacyCheck.checked) {
        alert("Debes aceptar las Políticas de Privacidad para continuar con tu compra.");
        return;
    }

    if (quotedShippingCost === 0) {
        alert("Por favor, hacé clic en 'Cotizar Envío' antes de proceder al pago.");
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    // Efecto de carga en el botón
    btn.innerHTML = 'Procesando... <i class="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block"></i>';
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    try {
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const zip = document.getElementById('zip').value;
        const province = document.getElementById('province').value;

        const response = await fetch('/.netlify/functions/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: cart,
                delivery: delivery,
                shippingCost: quotedShippingCost,
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    dni: customerDni,
                    address: address,
                    city: city,
                    zip: zip,
                    province: province
                }
            })
        });
        const data = await response.json();

        if (response.ok && data.init_point) {
            cart = [];
            updateCartUI();
            closeModal();
            window.open(data.init_point, '_blank');
            showPage('success-view');
        } else {
            throw new Error(data.error || "Error en Mercado Pago");
        }
    } catch (error) {
        console.error("Error al ejecutar fetch:", error);
        btn.innerHTML = originalText;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        alert("Hubo un problema al conectar con Mercado Pago. Revisa tu conexión e intenta nuevamente.");
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
        alert("Por favor, ingresa un correo electrónico válido para suscribirte.");
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
