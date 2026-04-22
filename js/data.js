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
                <div class="space-y-3 mb-4">
                    <div>
                        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Nombre completo</label>
                        <input type="text" id="customer-name" placeholder="Tu nombre" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-lilac text-sm">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Teléfono</label>
                        <input type="tel" id="customer-phone" placeholder="Ej: 11 1234 5678" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-lilac text-sm">
                    </div>
                </div>

                <p class="font-medium text-brand-text mb-3 text-sm md:text-base">Selecciona tu método de entrega:</p>
                
                <div class="space-y-3 mb-6">
                    <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-brand-light transition">
                        <input type="radio" name="delivery" value="pickup" checked onchange="toggleShippingFields(false)" class="text-brand-lilac focus:ring-brand-lilac w-4 h-4">
                        <span class="text-gray-700 font-medium text-sm md:text-base">Retiro en persona <span class="text-xs text-gray-500 font-normal block mt-1">Coordinar entrega (Zona Norte, GBA)</span></span>
                    </label>
                    <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-brand-light transition">
                        <input type="radio" name="delivery" value="shipping" onchange="toggleShippingFields(true)" class="text-brand-lilac focus:ring-brand-lilac w-4 h-4">
                        <span class="text-gray-700 font-medium text-sm md:text-base">Envío a domicilio</span>
                    </label>
                </div>

                <div id="shipping-fields" class="hidden space-y-3 mb-6 bg-brand-light/50 p-4 rounded-xl border border-brand-lilac/30">
                    <h4 class="font-medium text-sm text-brand-text mb-1">Datos de envío:</h4>
                    <input type="text" id="address" placeholder="Dirección completa (Calle y altura)" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-lilac text-sm">
                    <div class="grid grid-cols-2 gap-3">
                        <input type="text" id="city" placeholder="Ciudad" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-lilac text-sm">
                        <input type="text" id="zip" placeholder="C. Postal" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-lilac text-sm">
                    </div>
                    <input type="text" id="province" placeholder="Provincia" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-lilac text-sm">
                </div>

                <div class="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <p class="font-medium text-brand-text mb-3 text-sm">Medio de pago:</p>
                    
                    <div class="space-y-2">
                        <label class="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition bg-white">
                            <input type="radio" name="payment" value="cash" checked class="text-brand-lilac focus:ring-brand-lilac w-4 h-4" onchange="togglePaymentMethod('cash')">
                            <span class="text-sm font-medium text-gray-700">Efectivo al retirar</span>
                        </label>
                        <label class="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition bg-white">
                            <input type="radio" name="payment" value="mp" class="text-brand-lilac focus:ring-brand-lilac w-4 h-4" onchange="togglePaymentMethod('mp')">
                            <span class="text-sm font-medium text-[#009EE3] flex items-center gap-2">
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14.42 10.14a4 4 0 0 1-4-4V4.5a1.5 1.5 0 0 0-3 0v1.64a4 4 0 0 1-4 4H1.5a1.5 1.5 0 0 0 0 3h1.92a4 4 0 0 1 4 4v1.64a1.5 1.5 0 0 0 3 0v-1.64a4 4 0 0 1 4-4h1.92a1.5 1.5 0 0 0 0-3h-1.92z"/></svg>
                                Mercado Pago
                            </span>
                        </label>
                        <label class="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition bg-white">
                            <input type="radio" name="payment" value="wpp" class="text-brand-lilac focus:ring-brand-lilac w-4 h-4" onchange="togglePaymentMethod('wpp')">
                            <span class="text-sm font-medium text-green-600 flex items-center gap-2">
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                WhatsApp
                            </span>
                        </label>
                    </div>
                </div>

                <div id="payment-details" class="mb-4 p-3 rounded-xl bg-brand-lilac/10 border border-brand-lilac/20 text-sm text-gray-600 hidden">
                    <p id="payment-instructions"></p>
                </div>

                <button type="submit" class="w-full bg-brand-text text-white py-4 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg flex items-center justify-center gap-2">
                    Confirmar Pedido <i data-lucide="check" class="w-4 h-4"></i>
                </button>
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
            <button onclick="closeModal(); showPage('product-view');" class="mt-4 w-full bg-brand-lilac text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition shadow-sm">Ver detalles del libro para seguir leyendo</button>
        `
    },
    subscribe: {
        title: "Novedades",
        icon: "mail",
        content: `
            <iframe name="hidden_iframe" id="hidden_iframe" style="display:none;"></iframe>
            
            <form action="https://c4dbfde8.sibforms.com/serve/MUIFAFucGxlLSVVMIyWGX25m6RxpThHoNAjjAN4gTElQ2c-Dnp8MvJFxBORy6b3jC3bIEckj3y3YW0MWybSKcpROinDoqtvtG5ouMRk69_ar2o7VrH_IczOx-FpHkjniFVuzm8grGU-14n3LzBlZdF5XUvGJXkzFQJ5je-MBjDMxE2S7IF7xjHNWFPgslhlJRih4zqJBRiwk74SBAg==" method="POST" target="hidden_iframe" onsubmit="handleSubscribeSubmit(event)">
                <p class="mb-5 text-gray-600 text-sm md:text-base">Déjanos tu email para enterarte cuando el próximo volumen esté disponible y recibir novedades exclusivas.</p>
                
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
