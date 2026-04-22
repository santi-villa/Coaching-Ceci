let cart = [];
let isCartOpen = false;

const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const cartBadge = document.getElementById('cart-badge');
const cartItemsContainer = document.getElementById('cart-items');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

function toggleCart() {
    isCartOpen = !isCartOpen;
    if (isCartOpen) {
        cartOverlay.classList.remove('hidden');
        setTimeout(() => {
            cartOverlay.classList.remove('opacity-0');
            cartOverlay.classList.add('opacity-100');
            cartDrawer.classList.remove('translate-x-full');
        }, 10);
        document.body.style.overflow = 'hidden';
    } else {
        cartDrawer.classList.add('translate-x-full');
        cartOverlay.classList.remove('opacity-100');
        cartOverlay.classList.add('opacity-0');
        setTimeout(() => {
            cartOverlay.classList.add('hidden');
        }, 300);
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
    toggleCart();
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
    toggleCart();
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
    const fields = document.getElementById('shipping-fields');

    if (show) {
        fields.classList.remove('hidden');
        document.getElementById('address').required = true;
        document.getElementById('city').required = true;
        document.getElementById('zip').required = true;
        document.getElementById('province').required = true;
    } else {
        fields.classList.add('hidden');
        document.getElementById('address').required = false;
        document.getElementById('city').required = false;
        document.getElementById('zip').required = false;
        document.getElementById('province').required = false;
    }
}

async function handleCheckout(e) {
    e.preventDefault(); // Esto va siempre primero para que la página no recargue

    // 1. PRIMERO capturamos los datos
    const customerPhone = document.getElementById('customer-phone').value;
    const customerName = document.getElementById('customer-name').value;
    const delivery = document.querySelector('input[name="delivery"]:checked').value;
    const payment = document.querySelector('input[name="payment"]:checked').value;

    // 2. DESPUÉS validamos el teléfono (ahora sí existe la variable)
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ""))) {
        alert("Por favor, ingresa un número de teléfono válido (solo números, código de área sin 0 ni 15).");
        return; // Corta la ejecución si está mal
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    let itemsList = '';
    let totalPrice = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        itemsList += `• ${item.title} x${item.quantity}: $${itemTotal.toLocaleString('es-AR')}\n`;
    });

    let deliveryInfo = '';
    if (delivery === 'pickup') {
        deliveryInfo = '📍 Retiro en persona (Zona Norte, GBA)';
    } else {
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const zip = document.getElementById('zip').value;
        const province = document.getElementById('province').value;
        deliveryInfo = `📦 Envío a:\n${address}, ${city} (${zip}), ${province}`;
    }

    let paymentInfo = '';
    if (payment === 'cash') {
        paymentInfo = '💵 Efectivo al retirar';
    } else if (payment === 'mp') {
        paymentInfo = '💳 Mercado Pago';
    } else if (payment === 'wpp') {
        paymentInfo = '💬 WhatsApp';
    }

    const message = `🛒 *Nuevo Pedido - Libro "Comunicar para vivir más livianos"*\n\n` +
        `👤 *Cliente:* ${customerName}\n` +
        `📱 *Teléfono:* ${customerPhone}\n\n` +
        `📚 *Productos:*\n${itemsList}\n` +
        `💰 *Total:* $${totalPrice.toLocaleString('es-AR')} ARS\n\n` +
        `🚚 *Entrega:*\n${deliveryInfo}\n\n` +
        `💳 *Pago:* ${paymentInfo}\n\n` +
        `¡Gracias por tu compra!`;

    // Efecto de carga en el botón
    btn.innerHTML = 'Procesando... <i class="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block"></i>';
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    // Definimos los datos de WhatsApp acá afuera para que estén disponibles
    const whatsappNumber = '5491123189132';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    if (payment === 'mp') {
        // Guardamos el link de WhatsApp en la memoria temporal del navegador
        localStorage.setItem('whatsappUrl_pendiente', whatsappUrl);

        try {
            // Redirigimos a la API enviando el carrito actual
            const response = await fetch('/.netlify/functions/checkout', {
                method: 'POST',
                body: JSON.stringify({ 
                    cart: cart,
                    delivery: delivery 
                })
            });
            const data = await response.json();

            // Vaciamos carrito DESPUÉS de haber leído los datos
            cart = [];
            updateCartUI();

            if (response.ok && data.init_point) {
                // Redirigimos a Mercado Pago SIN ABRIR WHATSAPP
                window.location.href = data.init_point;
            } else {
                console.error("Error de MP:", data);
                btn.innerHTML = originalText;
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
                alert("Hubo un problema al conectar con Mercado Pago: " + (data.error || "Asegúrate de que el token sea válido."));
            }
        } catch (error) {
            console.error("Error al ejecutar fetch:", error);
            btn.innerHTML = originalText;
            btn.classList.remove('opacity-75', 'cursor-not-allowed');
            alert("Error de conexión con el servidor. Intenta nuevamente.");
        }
    } else {
        // Si es efectivo (cash), abrimos WPP directo porque no hay pasarela de pago
        window.open(whatsappUrl, '_blank');
        cart = [];
        updateCartUI();
        closeModal();
        showPage('success-view');

        btn.innerHTML = originalText;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

function togglePaymentMethod(method) {
    const detailsDiv = document.getElementById('payment-details');
    const instructions = document.getElementById('payment-instructions');
    if (!detailsDiv || !instructions) return;

    if (method === 'cash') {
        instructions.textContent = '💵 El pago se realizará en efectivo cuando retires el libro.';
        detailsDiv.classList.remove('hidden');
    } else if (method === 'mp') {
        instructions.innerHTML = '💳 Serás redirigido a Mercado Pago para abonar de forma segura.';
        detailsDiv.classList.remove('hidden');
    } else if (method === 'wpp') {
        instructions.innerHTML = '💬 Serás redirigido a WhatsApp para coordinar el pago directamente con nosotros.';
        detailsDiv.classList.remove('hidden');
    } else {
        detailsDiv.classList.add('hidden');
    }
}

function handleSubscribeSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('subs-btn');
    const msg = document.getElementById('subs-msg');

    btn.innerHTML = 'Enviando... <i class="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block"></i>';
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    setTimeout(() => {
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Enviado';
        btn.className = 'w-full bg-gray-200 text-gray-500 py-3.5 rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2';
        btn.disabled = true;

        msg.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }, 1500);
}
