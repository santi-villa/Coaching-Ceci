const productInfo = {
    id: 'libro_vol1',
    title: 'Comunicar para vivir más livianos',
    price: 25000,
    image: 'Libro.png'
};

const bookContent = {
    cover: `
        <p class="text-xl font-serif text-center text-gray-700 mb-4">COMUNICAR PARA VIVIR<br>MÁS LIVIANOS</p>
        <p class="text-lg text-gray-500 text-center">Cecilia Karina Rosso</p>
        <hr class="my-4 border-gray-200">
        <p class="text-sm text-gray-600 italic">"Una invitación a observar cómo nos comunicamos en la vida real..."</p>
    `,
    back: `
        <p class="text-lg leading-relaxed text-gray-700 mb-4">Sobre este libro:</p>
        <p class="text-base leading-relaxed text-gray-600 mb-4">No es un manual técnico ni estadísticas complicadas. Es una invitación a aprender a hablar con honestidad y con la verdad de lo que nos pasa, con presencia y respeto.</p>
        <p class="text-base leading-relaxed text-gray-600 mb-4">A través de ejemplos reales y preguntas que sirven para mirar los vínculos con otros ojos.</p>
        <div class="mt-6 pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-500">Edición Servicop</p>
        </div>
    `
};

const modalData = {
    checkout: {
        title: "Finalizar Compra",
        icon: "shopping-cart",
        content: `
            <form id="checkout-form" onsubmit="handleCheckout(event)">
                
                <p class="font-medium text-brand-text mb-3 text-sm md:text-base border-b border-brand-lilac/20 pb-2">1. Selecciona cómo recibir tu pedido:</p>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-brand-light transition bg-white shadow-sm">
                        <input type="radio" name="delivery" value="shipping" checked onchange="toggleShippingFields(true)" class="text-brand-lilac focus:ring-brand-lilac w-4 h-4">
                        <span class="text-gray-700 font-medium text-sm md:text-base">Envío a domicilio</span>
                    </label>
                    <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-brand-light transition bg-white shadow-sm">
                        <input type="radio" name="delivery" value="pickup" onchange="toggleShippingFields(false)" class="text-brand-lilac focus:ring-brand-lilac w-4 h-4">
                        <span class="text-gray-700 font-medium text-sm md:text-base">Retiro en persona <span class="text-xs text-gray-500 font-normal block mt-1">Coordinar entrega (GBA Norte)</span></span>
                    </label>
                </div>

                <p class="font-medium text-brand-text mb-3 text-sm md:text-base border-b border-brand-lilac/20 pb-2">2. Completa tus datos:</p>
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Nombre completo</label>
                            <input type="text" id="customer-name" placeholder="Tu nombre" required class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm focus:outline-none focus:border-brand-lilac text-sm transition">
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">DNI</label>
                            <input type="number" id="customer-dni" placeholder="Sin puntos" required class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm focus:outline-none focus:border-brand-lilac text-sm transition">
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Teléfono</label>
                            <input type="tel" id="customer-phone" placeholder="Ej: 11 1234 5678" required class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm focus:outline-none focus:border-brand-lilac text-sm transition">
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Email</label>
                            <input type="email" id="customer-email" placeholder="tu@correo.com" required class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm focus:outline-none focus:border-brand-lilac text-sm transition">
                        </div>
                    </div>

                    <!-- Datos exclusivo si es por Envío -->
                    <div id="shipping-fields" class="space-y-4 pt-4 mt-2 border-t border-gray-200">
                        <h4 class="font-semibold text-xs text-brand-lilac uppercase tracking-wider mb-2">Dirección de entrega</h4>
                        <input type="text" id="address" placeholder="Dirección completa (Calle, Altura, Piso y Depto)" class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm focus:outline-none focus:border-brand-lilac text-sm transition" required oninput="resetShippingQuote()">
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <input type="text" id="city" placeholder="Ciudad" class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm focus:outline-none focus:border-brand-lilac text-sm transition" required oninput="resetShippingQuote()">
                            <input type="text" id="zip" placeholder="C. Postal" class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm focus:outline-none focus:border-brand-lilac text-sm transition" required oninput="resetShippingQuote()">
                            <input type="text" id="province" placeholder="Provincia" class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm focus:outline-none focus:border-brand-lilac text-sm transition" required oninput="resetShippingQuote()">
                        </div>

                        <div class="mt-4 flex items-center justify-between border border-brand-lilac/30 rounded-xl p-3 bg-brand-pink/5 shadow-sm">
                            <div class="flex items-center gap-2">
                                <i data-lucide="truck" class="w-5 h-5 text-brand-lilac"></i>
                                <span id="shipping-cost-display" class="text-sm font-medium text-gray-600">Por cotizar...</span>
                            </div>
                            <button type="button" onclick="calculateShipping(event)" id="btn-calc-shipping" class="bg-white border border-brand-lilac text-brand-lilac px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-brand-lilac hover:text-white transition shadow-sm">Cotizar Envío</button>
                        </div>
                    </div>
                </div>

                <div class="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <p class="font-medium text-brand-text mb-3 text-sm">3. Medio de pago:</p>
                    
                    <div class="space-y-2">
                        <label id="label-cash" class="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition bg-white">
                            <input type="radio" name="payment" value="cash" checked class="text-brand-lilac focus:ring-brand-lilac w-4 h-4 accent-brand-lilac" onchange="togglePaymentMethod('cash')">
                            <span class="text-sm font-medium text-gray-700">Efectivo al retirar</span>
                        </label>
                        <label class="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition bg-white">
                            <input type="radio" name="payment" value="mp" class="text-brand-lilac focus:ring-brand-lilac w-4 h-4 accent-brand-lilac" onchange="togglePaymentMethod('mp')">
                            <span class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <img src="https://cdn.simpleicons.org/mercadopago/009EE3" alt="Mercado Pago" class="h-4 w-auto">
                                Mercado Pago
                            </span>
                        </label>
                    </div>
                </div>

                <div class="mb-5 mt-2 bg-brand-light/30 p-3 rounded-xl border border-brand-lilac/30">
                    <label class="flex items-start space-x-3 cursor-pointer">
                        <div class="mt-0.5">
                            <input type="checkbox" id="privacy-policy" required class="w-5 h-5 accent-brand-lilac cursor-pointer">
                        </div>
                        <span class="text-xs text-gray-600 leading-snug">
                            He leído y acepto las <a href="#legales" onclick="closeModal(); showPage('legales-view');" class="text-brand-lilac font-bold hover:underline">Políticas de Privacidad</a> y autorizo el tratamiento de mis datos de envío.
                        </span>
                    </label>
                </div>

                <div id="payment-details" class="mb-4 p-3 rounded-xl bg-brand-lilac/10 border border-brand-lilac/20 text-sm text-gray-600 hidden">
                    <p id="payment-instructions"></p>
                </div>

                <button type="submit" class="w-full bg-brand-text text-white py-4 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg flex items-center justify-center gap-2">
                    Confirmar Pedido <i data-lucide="check" class="w-4 h-4"></i>
                </button>

                <div class="mt-4 text-center">
                    <button type="button" onclick="closeModal()" class="text-gray-500 hover:text-brand-text text-sm font-medium transition flex items-center justify-center gap-1 mx-auto">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Volver a la tienda
                    </button>
                </div>
            </form>
        `
    },
    read: {
        title: "Primer Vistazo",
        icon: "book-open",
        content: `
            <p class="mb-3 italic">"Todos nos comunicamos. Desde que nos despertamos hasta que nos dormimos, estamos en contacto con otros: hablamos, escribimos, respondemos, escuchamos, callamos."</p>
            <p class="mb-3">Sin embargo, muchas veces sentimos que no nos entienden, o que nosotros no entendemos a los demás. Que hablamos mucho, pero que conectamos poco o que no conectamos.</p>
            <p class="mb-3">Que el vínculo se desgasta, aunque las palabras sigan ahí...</p>
            <button onclick="closeModal(); openProductModal();" class="mt-4 w-full bg-brand-lilac text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition shadow-sm">Ver detalles del libro para seguir leyendo</button>
        `
    },
    success: {
        title: "¡Compra Exitosa!",
        icon: "check-circle",
        content: `
            <div class="text-center py-4">
                <i data-lucide="party-popper" class="w-16 h-16 text-brand-lilac mx-auto mb-4 animate-bounce"></i>
                <p class="mb-4 text-gray-700 text-lg">Hemos recibido tu pago con éxito en Mercado Pago.</p>
                <p class="mb-6 text-gray-500 text-sm">En contados minutos te llegará un correo electrónico oficial de Brevo confirmándote el detalle de tu compra y las instrucciones de envío o retiro.</p>
                <button onclick="closeModal();" class="w-full bg-brand-text text-white py-4 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg">Entendido ✓</button>
            </div>
        `
    },
    subscribe: {
        title: "Novedades",
        icon: "mail",
        content: `
            <iframe name="hidden_iframe" id="hidden_iframe" style="display:none;"></iframe>
            
            <form action="https://c4dbfde8.sibforms.com/serve/MUIFAFucGxlLSVVMIyWGX25m6RxpThHoNAjjAN4gTElQ2c-Dnp8MvJFxBORy6b3jC3bIEckj3y3YW0MWybSKcpROinDoqtvtG5ouMRk69_ar2o7VrH_IczOx-FpHkjniFVuzm8grGU-14n3LzBlZdF5XUvGJXkzFQJ5je-MBjDMxE2S7IF7xjHNWFPgslhlJRih4zqJBRiwk74SBAg==" method="POST" target="hidden_iframe" onsubmit="handleSubscribeSubmit(event)">
                <p class="mb-5 text-gray-600 text-sm md:text-base">Déjanos tu email para enterarte cuando el próximo volumen esté disponible y recibir novedades exclusivas.</p>
                <div class="bg-brand-pink/10 border border-brand-pink/30 p-3 rounded-lg flex items-start gap-3 mb-5">
                    <i data-lucide="alert-circle" class="w-5 h-5 text-brand-pink flex-shrink-0 mt-0.5"></i>
                    <p class="text-xs text-gray-700">Importante: Es muy probable que tu confirmación llegue a la <strong>bandeja de Spam o Correo no deseado</strong>. ¡No olvides revisarla!</p>
                </div>
                
                <div class="space-y-4">
                    <input type="email" id="EMAIL" name="EMAIL" placeholder="Tu correo electrónico" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac transition">
                    
                    <input type="text" name="email_address_check" value="" class="hidden">
                    <input type="hidden" name="locale" value="es">
                    
                    <button type="submit" id="subs-btn" class="w-full bg-brand-text text-white py-3.5 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg flex items-center justify-center gap-2">
                        Suscribirse <i data-lucide="send" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div id="subs-msg" class="mt-4 hidden bg-brand-green/10 p-4 rounded-xl border border-brand-green/30 transition-all">
                    <div class="flex flex-col items-center gap-2 text-center">
                        <p class="text-sm text-brand-green font-bold flex items-center justify-center gap-2">
                            <i data-lucide="mail-check" class="w-5 h-5"></i> ¡Casi listo!
                        </p>
                        <p class="text-sm text-gray-700 font-medium leading-relaxed">
                            Te enviamos un correo. Por favor, <strong class="text-brand-text">revisa tu bandeja de entrada (o Spam)</strong> para confirmar tu suscripción.
                        </p>
                    </div>
                </div>
                
                <p class="text-xs text-gray-400 mt-4 text-center">Tus datos están protegidos. No enviamos spam.</p>
            </form>
        `
    }
};
