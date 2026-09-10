let productInfo = {
    id: 'libro_vol1',
    title: 'Comunicar para vivir más livianos',
    price: 25000,
    image: 'assets/images/libro-comunicar-portada.webp'
};

const bookContent = {
    cover: `
        <p class="text-xl font-serif text-center text-brand-text/80 mb-4">COMUNICAR PARA VIVIR<br>MÁS LIVIANOS</p>
        <p class="text-lg text-brand-text/60 text-center">Cecilia Karina Rosso</p>
        <hr class="my-4 border-brand-lilac/15">
        <p class="text-sm text-brand-text/70 italic">"Una invitación a observar cómo nos comunicamos en la vida real..."</p>
    `,
    back: `
        <p class="text-lg leading-relaxed text-brand-text/80 mb-4">Sobre este libro:</p>
        <p class="text-base leading-relaxed text-brand-text/70 mb-4">Todos nos comunicamos. Desde que nos despertamos hasta que nos dormimos, estamos en contacto con otros: hablamos, escribimos, respondemos, escuchamos, callamos.
</p>
        <p class="text-base leading-relaxed text-brand-text/70 mb-4">Sin embargo, muchas veces sentimos que no nos entienden, o que nosotros no entendemos a los demás. Que hablamos mucho, pero que conectamos poco o que no conectamos. Que el vínculo se desgasta, aunque las palabras sigan ahí.</p>
        <p class="text-base leading-relaxed text-brand-text/70 mb-4">Este libro no pretende ser un manual o una guía técnica. Es una invitación a observar cómo nos comunicamos en la vida real, con nuestra pareja, con nuestros hijos, con amigos, en el trabajo. En situaciones simples y complejas. Nos invita a reconocer los errores más comunes que todos, de una manera u otra, cometemos. Y a descubrir formas más claras y humanas de decir, escuchar y convivir.</p>
        <p class="text-base leading-relaxed text-brand-text/70 mb-4">No vas a encontrar definiciones complicadas ni teorías largas. Tampoco estadísticas sacadas de investigaciones de las mejores universidades del mundo. Mucho menos, tecnicismos que estén fuera de nuestro entendimiento. El objetivo de este libro es que puedas lograr tener "conversaciones posibles"; es decir que, al final de una conversación, como mensajero, te hayas sentido escuchado y comprendido. Que puedas sentir que del otro lado hubo atención a tu mensaje.</p>
        <p class="text-base leading-relaxed text-brand-text/70 mb-4">Que no fueron solo ruido y palabras sueltas. Y que, como receptor, pudiste escuchar y empatizar con la otra persona. En resumen, que se haya generado un feedback, es decir un ida y vuelta en una charla. Que sientas que pudiste estar presente y en los zapatos del otro, al menos un poquito más.</p>
        <p class="text-base leading-relaxed text-brand-text/70 mb-4">Este libro pretende dar ejemplos reales. Preguntas que sirvan para mirar tus vínculos con otros ojos. Porque no se trata de hablar a la perfección, sino de aprender a hablar con honestidad y con la verdad de lo que nos pasa. Con presencia y respeto.</p>
        <p class="text-base leading-relaxed text-brand-text/70 mb-4">Si alguna vez te pasó sentir que no te escuchan, que no sabes cómo decir algo sin lastimar, o que callas por miedo a perder un vínculo, este libro es para vos.
</p>
        <div class="mt-6 pt-4 border-t border-brand-lilac/15">
            <p class="text-sm text-brand-text/60">Edición Servicop</p>
        </div>
    `
};

const bookCatalog = [
    {
        id: 'libro_vol1',
        title: 'Comunicar para vivir más livianos',
        price: 25000,
        priceLabel: '$25.000',
        listPrice: 30000,
        listPriceLabel: '$30.000',
        webDiscountLabel: 'Precio web · 17% off',
        currency: 'ARS',
        image: 'assets/images/libro-comunicar-portada.webp',
        backImage: 'assets/images/libro-comunicar-contraportada.webp',
        imageAlt: 'Fotografía de la portada del libro Comunicar para vivir más livianos',
        backImageAlt: 'Fotografía de la contratapa del libro Comunicar para vivir más livianos',
        available: true,
        statusLabel: 'Disponible',
        heroEyebrow: 'Nuevo lanzamiento',
        heroTitleHtml: '<span class="hero-title-line">Comunicar para vivir</span><span class="hero-title-line hero-title-line--secondary">más livianos</span>',
        heroKicker: '¡Vive más liviano, comunica mejor!',
        heroDescription: 'Una invitación a observar cómo nos comunicamos en la vida real. Descubrí formas más claras y humanas de decir, escuchar y convivir para tener "conversaciones posibles".',
        productKicker: 'Libro físico',
        productDescription: 'Una invitación a observar cómo nos comunicamos en la vida real y a encontrar formas más claras, humanas y posibles de decir, escuchar y convivir.',
        meta: {
            label: 'Formato',
            value: 'Tapa blanda',
            format: 'Tapa blanda',
            pages: '104',
            size: '15x21 cm',
            binding: 'Con solapas',
            paper: 'Bookcel ahuesado',
            language: 'Español'
        },
        backCopy: 'Una invitación a observar cómo nos comunicamos, reconocer aquello que pesa y descubrir formas más claras y humanas de decir, escuchar y convivir.',
        highlights: [
            '<strong>Conversaciones posibles:</strong> claves para desenredar malentendidos sin agresividad.',
            '<strong>La pausa y la escucha activa:</strong> ejercicios para dialogar con presencia.',
            '<strong>Callar para cuidar:</strong> la sabiduría del silencio compasivo y el límite saludable.',
            '<strong>Reflexiones guiadas:</strong> preguntas para mirar tus vínculos con otros ojos.'
        ],
        previewTitle: 'Primer vistazo',
        previewHtml: `
            <p class="mb-3 italic">"Todos nos comunicamos. Desde que nos despertamos hasta que nos dormimos, estamos en contacto con otros: hablamos, escribimos, respondemos, escuchamos, callamos."</p>
            <p class="mb-3">Sin embargo, muchas veces sentimos que no nos entienden, o que nosotros no entendemos a los demás. Que hablamos mucho, pero que conectamos poco o que no conectamos.</p>
            <p class="mb-3">Que el vínculo se desgasta, aunque las palabras sigan ahí...</p>
        `,
        aboutTitle: 'Contraportada',
        aboutHtml: bookContent.back
    },
    {
        id: 'proximo_libro',
        title: 'Propósito',
        subtitle: 'Un viaje profundo hacia el sentido de la vida',
        image: 'assets/images/libro-proposito-portada.webp?v=2',
        backImage: 'assets/images/libro-proposito-contraportada.webp?v=2',
        imageAlt: 'Portada provisional del libro Propósito, de Cecilia Karina Rosso',
        backImageAlt: 'Contratapa provisional del libro Propósito, de Cecilia Karina Rosso',
        available: false,
        statusLabel: 'Próximo lanzamiento',
        heroEyebrow: 'Próximo lanzamiento',
        heroTitleHtml: '<span class="hero-title-line">Propósito</span><span class="hero-title-line hero-title-line--secondary">Un viaje profundo hacia el sentido de la vida</span>',
        heroKicker: 'Un viaje profundo hacia el sentido de la vida',
        heroDescription: 'Una invitación a mirar hacia adentro, descubrir una brújula propia y acercarnos a aquello que da sentido a nuestra vida.',
        productKicker: 'Próximo lanzamiento',
        productDescription: 'Una invitación a mirar hacia adentro, descubrir una brújula propia y acercarnos a aquello que da sentido a nuestra vida.',
        productDescriptionHtml: `
            <p>Todos queremos encontrar nuestro propósito, pero no siempre sabemos dónde buscarlo. Muchas veces aprendimos a perseguir metas, éxitos y reconocimiento afuera, mientras dejamos en segundo plano aquello que verdaderamente nos hace bien, nos apasiona y da sentido a nuestra vida.</p>
            <p><cite>Propósito</cite> es una invitación a mirar hacia adentro y descubrir una brújula propia. A través de sus páginas, Cecilia Karina Rosso acompaña un recorrido de preguntas y reflexión para reconocer qué te mueve, qué lugar querés ocupar en el mundo y qué puede hacer que cada mañana tenga un para qué.</p>
        `,
        meta: {
            label: 'Editorial',
            value: 'Servicop',
            pages: '168',
            size: '15 × 21 cm'
        },
        backCopy: 'Una invitación a mirar hacia adentro y descubrir una brújula propia.',
        previewTitle: 'Primer vistazo',
        previewHtml: `
            <p class="mb-3">Todos queremos encontrar nuestro propósito, pero no siempre sabemos dónde buscarlo. Muchas veces aprendimos a perseguir metas, éxitos y reconocimiento afuera, mientras dejamos en segundo plano aquello que verdaderamente nos hace bien, nos apasiona y da sentido a nuestra vida.</p>
            <p class="mb-3"><cite>Propósito</cite> es una invitación a mirar hacia adentro y descubrir una brújula propia.</p>
        `,
        aboutTitle: 'Sobre este libro',
        aboutHtml: `
            <p class="text-base leading-relaxed text-brand-text/70 mb-4">Todos queremos encontrar nuestro propósito, pero no siempre sabemos dónde buscarlo. Muchas veces aprendimos a perseguir metas, éxitos y reconocimiento afuera, mientras dejamos en segundo plano aquello que verdaderamente nos hace bien, nos apasiona y da sentido a nuestra vida.</p>
            <p class="text-base leading-relaxed text-brand-text/70 mb-4"><cite>Propósito</cite> es una invitación a mirar hacia adentro y descubrir una brújula propia. A través de sus páginas, Cecilia Karina Rosso acompaña un recorrido de preguntas y reflexión para reconocer qué te mueve, qué lugar querés ocupar en el mundo y qué puede hacer que cada mañana tenga un para qué.</p>
            <div class="mt-6 pt-4 border-t border-brand-lilac/15">
                <p class="text-sm text-brand-text/60">Editorial Servicop</p>
            </div>
        `
    }
];

let selectedBookId = bookCatalog[0].id;

function getBookById(bookId) {
    return bookCatalog.find(book => book.id === bookId) || null;
}

function getSelectedBook() {
    return getBookById(selectedBookId) || bookCatalog[0];
}

function bookHasListedPrice(book) {
    return Boolean(book?.priceLabel) && typeof book?.price === 'number' && book.price > 0;
}

function syncProductInfo(book = getSelectedBook()) {
    productInfo = {
        id: book.id,
        title: book.title,
        price: book.price,
        image: book.image,
        available: book.available
    };
}

syncProductInfo();

const modalData = {
    checkout: {
        title: "Finalizar Compra",
        icon: "shopping-cart",
        content: `
            <form id="checkout-form" class="checkout-form" onsubmit="handleCheckout(event)" novalidate>
                <div class="checkout-trust-header">
                    <div class="checkout-store-lockup">
                        <span class="checkout-store-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M6 7h12l-1 12H7L6 7z"></path>
                                <path d="M9 7V6a3 3 0 0 1 6 0v1"></path>
                            </svg>
                        </span>
                        <strong>Cecilia Rosso</strong>
                        <span class="checkout-header-divider" aria-hidden="true"></span>
                        <div class="checkout-mp-lockup">
                            <span>Pagá seguro con</span>
                            <img class="checkout-mp-logo" src="assets/images/mercado-pago-logo.png" alt="Mercado Pago">
                        </div>
                    </div>
                    <button type="button" class="checkout-header-cart" onclick="focusCheckoutSummary()" aria-label="Ver resumen del pedido">
                        <i data-lucide="shopping-cart"></i>
                        <span id="checkout-header-cart-count">0</span>
                    </button>
                </div>

                <div id="checkout-message" class="hidden checkout-message"></div>

                <div class="checkout-main-column">
                    <section class="checkout-block checkout-contact-block">
                        <div class="checkout-block-heading">
                            <h2>Contacto</h2>
                        </div>
                        <div class="checkout-input-icon-wrap">
                            <input type="email" id="customer-email" autocomplete="email" placeholder="Correo electrónico" required oninput="validateInput(this)">
                            <i data-lucide="mail"></i>
                        </div>
                        <label class="checkout-checkbox-line">
                            <input type="checkbox" id="checkout-newsletter">
                            <span>Enviarme novedades y ofertas por correo electrónico</span>
                        </label>
                    </section>

                    <section class="checkout-block checkout-payment-block">
                        <h2>Pago</h2>
                        <p class="checkout-security-copy"><i data-lucide="lock"></i> Todas las transacciones son seguras y están encriptadas.</p>
                        <div class="checkout-payment-box" data-method="mp">
                            <div class="checkout-payment-option">
                                <span class="checkout-payment-radio" aria-hidden="true"></span>
                                <strong class="checkout-mp-name">
                                    <img src="assets/images/mercado-pago-logo.png" alt="Mercado Pago">
                                </strong>
                                <div class="checkout-card-brands" aria-label="Tarjetas aceptadas por Mercado Pago">
                                    <span class="payment-brand payment-brand-visa" title="Visa">VISA</span>
                                    <span class="payment-brand payment-brand-mastercard" title="Mastercard"><i></i><i></i></span>
                                    <span class="payment-more-wrap">
                                        <span class="payment-brand payment-brand-more" title="American Express, Cabal y Naranja">+3</span>
                                        <div class="payment-more-popover" role="tooltip">
                                            <span class="payment-brand payment-brand-amex">AMEX</span>
                                            <span class="payment-brand payment-brand-cabal">cabal</span>
                                            <span class="payment-brand payment-brand-naranja">naranja</span>
                                        </div>
                                    </span>
                                </div>
                            </div>
                            <div class="checkout-payment-explainer checkout-payment-explainer-mp">
                                <i data-lucide="shield-check"></i>
                                <span>Se te redirigirá a Mercado Pago. Ahí podés pagar con tarjeta, dinero en cuenta o transferencia.</span>
                            </div>
                        </div>
                    </section>

                    <section class="checkout-block checkout-address-block">
                        <h2>Dirección de facturación</h2>
                        <div class="checkout-country-field"><span>País / Región</span><strong>Argentina</strong></div>
                        <div class="checkout-field-grid checkout-field-grid--two">
                            <input type="text" id="customer-name" autocomplete="given-name" placeholder="Nombre" required oninput="validateInput(this)">
                            <input type="text" id="customer-lastname" autocomplete="family-name" placeholder="Apellidos" required oninput="validateInput(this)">
                        </div>
                        <div class="checkout-field-grid checkout-field-grid--two">
                            <input type="text" id="customer-dni" inputmode="numeric" autocomplete="off" placeholder="DNI sin puntos" required oninput="validateInput(this)">
                            <input type="tel" id="customer-phone" autocomplete="tel" placeholder="Teléfono" required oninput="validateInput(this)">
                        </div>
                        <input type="text" id="street" class="checkout-full-field" autocomplete="address-line1" placeholder="Dirección" required oninput="resetShippingQuote(); validateInput(this)">
                        <div class="checkout-field-grid checkout-field-grid--two checkout-field-grid--street-extra">
                            <input type="text" id="street-number" placeholder="Número" required oninput="resetShippingQuote(); validateInput(this)">
                            <input type="text" id="apartment" autocomplete="address-line2" placeholder="Piso / depto" oninput="resetShippingQuote(); validateInput(this)">
                        </div>
                        <div class="checkout-field-grid checkout-field-grid--location">
                            <input type="text" id="zip" autocomplete="postal-code" placeholder="Código postal" required oninput="resetShippingQuote(); validateInput(this)">
                            <input type="text" id="city" autocomplete="address-level2" placeholder="Ciudad" required oninput="resetShippingQuote(); validateInput(this)">
                            <div class="checkout-select-wrap">
                                <select id="province" autocomplete="address-level1" required onchange="resetShippingQuote(); validateInput(this)">
                                    <option value="" disabled selected>Provincia / Estado</option>
                                    <option>Buenos Aires</option>
                                    <option value="CABA">Ciudad Autónoma de Buenos Aires</option>
                                    <option>Catamarca</option>
                                    <option>Chaco</option>
                                    <option>Chubut</option>
                                    <option>Córdoba</option>
                                    <option>Corrientes</option>
                                    <option>Entre Ríos</option>
                                    <option>Formosa</option>
                                    <option>Jujuy</option>
                                    <option>La Pampa</option>
                                    <option>La Rioja</option>
                                    <option>Mendoza</option>
                                    <option>Misiones</option>
                                    <option>Neuquén</option>
                                    <option>Río Negro</option>
                                    <option>Salta</option>
                                    <option>San Juan</option>
                                    <option>San Luis</option>
                                    <option>Santa Cruz</option>
                                    <option>Santa Fe</option>
                                    <option>Santiago del Estero</option>
                                    <option>Tierra del Fuego</option>
                                    <option>Tucumán</option>
                                </select>
                                <i data-lucide="chevron-down"></i>
                            </div>
                        </div>

                        <div id="shipping-quote-card" class="checkout-shipping-card">
                            <div>
                                <div><i data-lucide="truck"></i><span>Envío a domicilio</span></div>
                                <button type="button" onclick="calculateShipping(event)" id="btn-calc-shipping">Calcular envío</button>
                            </div>
                            <div id="shipping-cost-display">Completá la dirección para calcular el envío.</div>
                        </div>
                    </section>

                    <div class="checkout-privacy-wrap">
                        <label class="checkout-checkbox-line">
                            <input type="checkbox" id="privacy-policy" required>
                            <span>He leído y acepto las <a href="legales.html" target="_blank" rel="noopener">Políticas de Privacidad</a>.</span>
                        </label>
                    </div>

                    <button type="submit" class="checkout-submit"><i data-lucide="lock"></i> Pagar ahora</button>
                    <div class="checkout-protection-note"><i data-lucide="lock"></i><span>Tus datos personales están protegidos.</span></div>
                    <div class="checkout-footer-actions">
                        <a href="legales.html" target="_blank" rel="noopener">Política de privacidad</a>
                        <button type="button" onclick="leaveCheckoutPage()" class="checkout-back">Volver a la tienda</button>
                    </div>
                </div>

                <aside class="checkout-summary" aria-label="Resumen del pedido">
                    <div class="checkout-summary-heading">
                        <h4>Resumen del pedido</h4>
                        <span id="checkout-item-count">0 artículos</span>
                    </div>
                    <div id="checkout-items" class="checkout-items"></div>
                    <div class="checkout-totals">
                        <div><span>Subtotal</span><strong id="checkout-subtotal">$ 0,00</strong></div>
                        <div><span>Envío</span><strong id="checkout-shipping">Por calcular</strong></div>
                        <div class="checkout-total-row"><span>Total</span><strong><small>ARS</small> <span id="checkout-total">$ 0,00</span></strong></div>
                    </div>
                    <div class="checkout-summary-trust">
                        <i data-lucide="shield-check"></i>
                        <div>
                            <strong>Compra 100% protegida</strong>
                            <p>Si algo no sale como esperabas, te ayudamos.</p>
                        </div>
                    </div>
                </aside>

                <div class="hidden">
                    <input type="radio" name="delivery" value="shipping" checked>
                    <input type="radio" name="payment" id="payment-method-input" value="mp" checked>
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
            
            <form action="https://c4dbfde8.sibforms.com/serve/MUIFAFucGxlLSVVMIyWGX25m6RxpThHoNAjjAN4gTElQ2c-Dnp8MvJFxBORy6b3jC3bIEckj3y3YW0MWybSKcpROinDoqtvtG5ouMRk69_ar2o7VrH_IczOx-FpHkjniFVuzm8grGU-14n3LzBlZdF5XUvGJXkzFQJ5je-MBjDMxE2S7IF7xjHNWFPgslhlJRih4zqJBRiwk74SBAg==" method="POST" target="hidden_iframe" onsubmit="handleSubscribeSubmit(event)" novalidate>
                <p class="mb-5 text-brand-text/70 text-sm md:text-base">Déjanos tu email para enterarte cuando el próximo libro esté disponible y recibir novedades exclusivas.</p>
                <div class="bg-brand-lilac/10 border border-brand-lilac/20 p-3 rounded-lg flex items-start gap-3 mb-5">
                    <i data-lucide="alert-circle" class="w-5 h-5 text-brand-lilac flex-shrink-0 mt-0.5"></i>
                    <p class="text-xs text-brand-text/80">Importante: Es muy probable que tu confirmación llegue a la <strong>bandeja de Spam o Correo no deseado</strong>. ¡No olvides revisarla!</p>
                </div>
                
                <div class="space-y-4">
                    <input type="email" id="EMAIL" name="EMAIL" placeholder="Tu correo electrónico" required class="w-full px-4 py-3 bg-brand-cream border border-brand-lilac/15 rounded-xl focus:outline-none focus:border-brand-lilac focus:ring-1 focus:ring-brand-lilac transition" oninput="clearFieldError(this)">
                    
                    <input type="text" name="email_address_check" value="" class="hidden">
                    <input type="hidden" name="locale" value="es">
                    
                    <button type="submit" id="subs-btn" class="w-full bg-brand-lilac text-brand-cream py-3.5 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg flex items-center justify-center gap-2">
                        Suscribirse <i data-lucide="send" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div id="subs-msg" class="mt-4 hidden bg-brand-lilac/10 p-4 rounded-xl border border-brand-lilac/20 transition-all">
                    <div class="flex flex-col items-center gap-2 text-center">
                        <p class="text-sm text-brand-lilac font-bold flex items-center justify-center gap-2">
                            <i data-lucide="mail-check" class="w-5 h-5"></i> ¡Casi listo!
                        </p>
                        <p class="text-sm text-brand-text/80 font-medium leading-relaxed">
                            Te enviamos un correo. Por favor, <strong class="text-brand-text">revisa tu bandeja de entrada (o Spam)</strong> para confirmar tu suscripción.
                        </p>
                    </div>
                </div>
                
                <p class="text-xs text-brand-text/50 mt-4 text-center">Tus datos están protegidos. No enviamos spam.</p>
            </form>
        `
    }
};
