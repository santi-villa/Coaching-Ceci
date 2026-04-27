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
        <p class="text-base leading-relaxed text-gray-600 mb-4">Todos nos comunicamos. Desde que nos despertamos hasta que nos dormimos, estamos en contacto con otros: hablamos, escribimos, respondemos, escuchamos, callamos.
</p>
        <p class="text-base leading-relaxed text-gray-600 mb-4">Sin embargo, muchas veces sentimos que no nos entienden, o que nosotros no entendemos a los demás. Que hablamos mucho, pero que conectamos poco o que no conectamos. Que el vínculo se desgasta, aunque las palabras sigan ahí.</p>
        <p class="text-base leading-relaxed text-gray-600 mb-4">Este libro no pretende ser un manual o una guía técnica. Es una invitación a observar cómo nos comunicamos en la vida real, con nuestra pareja, con nuestros hijos, con amigos, en el trabajo. En situaciones simples y complejas. Nos invita a reconocer los errores más comunes que todos, de una manera u otra, cometemos. Y a descubrir formas más claras y humanas de decir, escuchar y convivir.</p>
        <p class="text-base leading-relaxed text-gray-600 mb-4">No vas a encontrar definiciones complicadas ni teorías largas. Tampoco estadísticas sacadas de investigaciones de las mejores universidades del mundo. Mucho menos, tecnicismos que estén fuera de nuestro entendimiento. El objetivo de este libro es que puedas lograr tener "conversaciones posibles"; es decir que, al final de una conversación, como mensajero, te hayas sentido escuchado y comprendido. Que puedas sentir que del otro lado hubo atención a tu mensaje.</p>
        <p class="text-base leading-relaxed text-gray-600 mb-4">Que no fueron solo ruido y palabras sueltas. Y que, como receptor, pudiste escuchar y empatizar con la otra persona. En resumen, que se haya generado un feedback, es decir un ida y vuelta en una charla. Que sientas que pudiste estar presente y en los zapatos del otro, al menos un poquito más.</p>
        <p class="text-base leading-relaxed text-gray-600 mb-4">Este libro pretende dar ejemplos reales. Preguntas que sirvan para mirar tus vínculos con otros ojos. Porque no se trata de hablar a la perfección, sino de aprender a hablar con honestidad y con la verdad de lo que nos pasa. Con presencia y respeto.</p>
        <p class="text-base leading-relaxed text-gray-600 mb-4">Si alguna vez te pasó sentir que no te escuchan, que no sabes cómo decir algo sin lastimar, o que callas por miedo a perder un vínculo, este libro es para vos.
</p>
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
                
                <div class="bg-brand-lilac/10 p-3 rounded-xl border border-brand-lilac/30 mb-6 flex items-center gap-3">
                    <i data-lucide="truck" class="w-5 h-5 text-brand-lilac"></i>
                    <p class="text-xs text-gray-700 font-medium">Estás realizando una compra con <strong>envío a domicilio</strong> y pago vía <strong>Mercado Pago</strong>.</p>
                </div>

                <p class="font-medium text-brand-text mb-3 text-sm md:text-base border-b border-brand-lilac/20 pb-2">Completa tus datos de envío:</p>
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Nombre completo</label>
                            <input type="text" id="customer-name" placeholder="Tu nombre" required class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm outline-none transition focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac" oninput="validateInput(this)">
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">DNI (Para el correo)</label>
                            <input type="number" id="customer-dni" placeholder="Sin puntos" required class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm outline-none transition focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac" oninput="validateInput(this)">
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Teléfono</label>
                            <input type="tel" id="customer-phone" placeholder="Ej: 11 1234 5678" required class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm outline-none transition focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac" oninput="validateInput(this)">
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Email</label>
                            <input type="email" id="customer-email" placeholder="tu@correo.com" required class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm outline-none transition focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac" oninput="validateInput(this)">
                        </div>
                    </div>

                    <div id="shipping-fields" class="space-y-4 pt-4 mt-2 border-t border-gray-200">
                        <input type="text" id="address" placeholder="Dirección completa (Calle, Altura, Piso y Depto)" class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm outline-none transition focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac text-sm" required oninput="resetShippingQuote(); validateInput(this)">
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <input type="text" id="city" placeholder="Ciudad" class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm outline-none transition focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac text-sm" required oninput="resetShippingQuote(); validateInput(this)">
                            <input type="text" id="zip" placeholder="C. Postal" class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm outline-none transition focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac text-sm" required oninput="resetShippingQuote(); validateInput(this)">
                            <input type="text" id="province" placeholder="Provincia" class="w-full px-4 py-3 border border-white bg-white rounded-xl shadow-sm outline-none transition focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac text-sm" required oninput="resetShippingQuote(); validateInput(this)">
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

                <div class="hidden">
                    <input type="radio" name="delivery" value="shipping" checked>
                    <input type="radio" name="payment" value="mp" checked>
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

                <button type="submit" class="w-full bg-brand-text text-white py-4 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg flex items-center justify-center gap-2">
                    Ir a pagar en Mercado Pago <i data-lucide="external-link" class="w-4 h-4"></i>
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
            <button onclick="closeModal(true); setTimeout(() => { openProductModal(); setTimeout(openBookDetails, 300); }, 300);" class="mt-4 w-full bg-brand-lilac text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition shadow-sm flex items-center justify-center gap-2">Ver detalles del libro</button>
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
