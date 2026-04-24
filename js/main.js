const mainNav = document.getElementById('main-nav');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');
const modal = document.getElementById('action-modal');
const modalCard = document.getElementById('modal-card');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const modalIcon = document.getElementById('modal-icon');

let menuOpen = false;
let isProductModalOpen = false;

function createLucideIcon(name, className) {
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', name);
    icon.className = className;
    return icon;
}

function setElementChildren(element, children) {
    element.replaceChildren(...children.filter(Boolean));
}

function setButtonIconLabel(button, iconName, label, iconClass = 'w-4 h-4') {
    if (!button) {
        return;
    }

    const labelText = document.createTextNode(label);
    setElementChildren(button, [labelText, createLucideIcon(iconName, iconClass)]);
    lucide.createIcons({ root: button });
}

function updateNavbar() {
    const currentView = document.querySelector('.view-section.block')?.id || 'home-view';
    const scrolled = window.scrollY > 50;

    if (currentView !== 'home-view' || scrolled) {
        mainNav.classList.remove('text-white', 'bg-transparent');
        mainNav.classList.add('text-brand-text', 'bg-white/95', 'backdrop-blur-md', 'shadow-sm');
    } else {
        mainNav.classList.add('text-white', 'bg-transparent');
        mainNav.classList.remove('text-brand-text', 'bg-white/95', 'backdrop-blur-md', 'shadow-sm');
    }
}

function updateMobileMenuButton() {
    if (!mobileMenuBtn) {
        return;
    }

    setElementChildren(mobileMenuBtn, [
        createLucideIcon(menuOpen ? 'x' : 'menu', 'w-8 h-8 drop-shadow-md'),
    ]);
    lucide.createIcons({ root: mobileMenuBtn });
}

function toggleMenu() {
    menuOpen = !menuOpen;
    if (menuOpen) {
        mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
        mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
    } else {
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
    }

    updateMobileMenuButton();
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-[90%] max-w-sm';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'transform transition-all duration-300 translate-y-full opacity-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-medium text-sm backdrop-blur-md';

    const iconName = type === 'success' ? 'check-circle' : 'info';
    const iconClass = type === 'success' ? 'w-5 h-5 text-brand-green' : 'w-5 h-5 text-brand-text';
    const textSpan = document.createElement('span');
    textSpan.className = type === 'success' ? 'text-gray-800' : 'text-brand-text';
    textSpan.textContent = message;

    if (type === 'success') {
        toast.classList.add('bg-white/95', 'border', 'border-gray-100');
    } else {
        toast.classList.add('bg-brand-pink/95', 'border', 'border-brand-lilac/30');
    }

    setElementChildren(toast, [createLucideIcon(iconName, iconClass), textSpan]);
    container.appendChild(toast);
    lucide.createIcons({ root: toast });

    requestAnimationFrame(() => {
        setTimeout(() => {
            toast.classList.remove('translate-y-full', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        }, 10);
    });

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function setModalIcon(name) {
    setElementChildren(modalIcon, [createLucideIcon(name, 'w-8 h-8')]);
    lucide.createIcons({ root: modalIcon });
}

function openModal(type) {
    const data = modalData[type];
    modalTitle.textContent = data.title;
    modalContent.innerHTML = data.content;
    setModalIcon(data.icon);

    if (type === 'checkout') {
        modalCard.classList.remove('max-w-lg');
        modalCard.classList.add('max-w-xl');
    } else {
        modalCard.classList.remove('max-w-2xl');
        modalCard.classList.add('max-w-lg');
    }

    if (window.location.hash !== `#${type}`) {
        window.history.pushState(null, '', `#${type}`);
    }

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    setTimeout(() => {
        modalCard.classList.remove('scale-95');
        modalCard.classList.add('scale-100');
    }, 10);
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeModal(forceState = null) {
    if (typeof forceState !== 'boolean' && forceState !== null) {
        forceState = null;
    }

    if (forceState === true) {
        _closeModal();
    } else if (window.location.hash) {
        window.history.back();
    } else {
        _closeModal();
    }
}

function _closeModal() {
    modalCard.classList.remove('scale-100');
    modalCard.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.remove('opacity-100', 'pointer-events-auto');
        modal.classList.add('opacity-0', 'pointer-events-none');

        if (typeof isCartOpen === 'undefined' || !isCartOpen) {
            document.body.style.overflow = 'auto';
        }

        const subsMsg = document.getElementById('subs-msg');
        const subsBtn = document.getElementById('subs-btn');
        if (subsMsg) {
            subsMsg.classList.add('hidden');
        }
        if (subsBtn) {
            subsBtn.disabled = false;
            subsBtn.className = 'w-full bg-brand-text text-white py-3.5 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg flex items-center justify-center gap-2';
            setButtonIconLabel(subsBtn, 'send', 'Suscribirse');
        }

        lucide.createIcons();
    }, 200);
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

function openProductModal() {
    isProductModalOpen = true;
    const view = document.getElementById('product-view');
    const card = document.getElementById('product-modal-card');

    if (window.location.hash !== '#producto') {
        window.history.pushState(null, '', '#producto');
    }

    view.classList.remove('opacity-0', 'pointer-events-none');
    view.classList.add('opacity-100', 'pointer-events-auto');
    setTimeout(() => {
        card.classList.remove('scale-95');
        card.classList.add('scale-100');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeProductModal(forceState = null) {
    if (typeof forceState !== 'boolean' && forceState !== null) {
        forceState = null;
    }

    if (forceState === true) {
        _closeProductModal();
    } else if (window.location.hash) {
        window.history.back();
    } else {
        _closeProductModal();
    }
}

function _closeProductModal() {
    isProductModalOpen = false;
    const view = document.getElementById('product-view');
    const card = document.getElementById('product-modal-card');

    card.classList.remove('scale-100');
    card.classList.add('scale-95');
    setTimeout(() => {
        view.classList.remove('opacity-100', 'pointer-events-auto');
        view.classList.add('opacity-0', 'pointer-events-none');
        if (!document.getElementById('action-modal') || document.getElementById('action-modal').classList.contains('pointer-events-none')) {
            if (typeof isCartOpen === 'undefined' || !isCartOpen) {
                document.body.style.overflow = 'auto';
            }
        }
    }, 200);
}

function scrollToTarget(targetId) {
    if (!targetId) {
        return;
    }

    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showPage(pageId) {
    const currentView = document.querySelector('.view-section.block') || document.querySelector('.view-section:not(.hidden)');
    const targetView = document.getElementById(pageId);

    if (currentView === targetView) {
        return;
    }

    if (currentView) {
        currentView.classList.remove('opacity-100');
        currentView.classList.add('opacity-0');

        setTimeout(() => {
            currentView.classList.remove('block');
            currentView.classList.add('hidden');

            targetView.classList.remove('hidden');
            targetView.classList.add('block');
            void targetView.offsetWidth;
            targetView.classList.remove('opacity-0');
            targetView.classList.add('opacity-100');

            lucide.createIcons();
            updateNavbar();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    } else {
        targetView.classList.remove('hidden');
        targetView.classList.add('block');
        void targetView.offsetWidth;
        targetView.classList.remove('opacity-0');
        targetView.classList.add('opacity-100');
        lucide.createIcons();
        updateNavbar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (menuOpen) {
        toggleMenu();
    }
}

function openBookDetails() {
    modalTitle.textContent = 'Contraportada';
    modalContent.innerHTML = bookContent.back;
    setModalIcon('book-open');

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    setTimeout(() => {
        modalCard.classList.remove('scale-95');
        modalCard.classList.add('scale-100');
    }, 10);
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function clearPendingPaymentState() {
    localStorage.removeItem('mpInitPoint_pendiente');
    localStorage.removeItem('whatsappUrl_pendiente');
}

function getPendingPaymentLink() {
    return localStorage.getItem('mpInitPoint_pendiente') || '';
}

function createActionButton({ label, icon, action, href = '', variant = 'primary' }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;

    if (href) {
        button.dataset.href = href;
    }

    const baseClass = 'px-8 py-4 rounded-full font-medium transition shadow-lg flex items-center justify-center gap-2 mx-auto';
    const variantClass = variant === 'secondary'
        ? 'bg-white text-brand-text border border-brand-lilac/20 hover:bg-brand-light shadow-sm'
        : variant === 'warning'
            ? 'bg-amber-500 text-white hover:bg-opacity-90'
            : variant === 'info'
                ? 'bg-[#009EE3] text-white hover:bg-opacity-90'
                : 'bg-brand-text text-white hover:bg-opacity-90';
    button.className = `${baseClass} ${variantClass}`;
    setElementChildren(button, [createLucideIcon(icon, 'w-5 h-5'), document.createTextNode(label)]);
    return button;
}

function setPaymentStatusNote(noteElement, config) {
    noteElement.replaceChildren();

    if (config.noteType === 'instagram') {
        noteElement.append('Si tienes alguna duda, puedes contactarnos por Instagram a ');
        const link = document.createElement('a');
        link.href = SITE_CONFIG.instagramUrl;
        link.target = '_blank';
        link.className = 'text-brand-lilac hover:underline';
        link.textContent = SITE_CONFIG.instagramHandle;
        noteElement.append(link);
    } else if (config.noteType === 'email') {
        noteElement.append('Si necesitás ayuda, podés escribirnos a ');
        const link = document.createElement('a');
        link.href = `mailto:${SITE_CONFIG.contactEmail}`;
        link.className = 'text-brand-lilac hover:underline';
        link.textContent = SITE_CONFIG.contactEmail;
        noteElement.append(link);
        noteElement.append('.');
    } else if (config.noteType === 'whatsapp') {
        noteElement.append('También podés escribirnos directamente a ');
        const link = document.createElement('a');
        link.href = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
        link.target = '_blank';
        link.className = 'text-brand-lilac hover:underline';
        link.textContent = SITE_CONFIG.whatsappDisplay;
        noteElement.append(link);
        noteElement.append('.');
    } else {
        noteElement.textContent = config.noteText || '';
    }
}

function setPaymentStatusActions(actionsElement, config) {
    actionsElement.replaceChildren();

    const buttons = config.actions.map((actionConfig) => createActionButton(actionConfig));
    actionsElement.append(...buttons);
    lucide.createIcons({ root: actionsElement });
}

function setPaymentStatusView(state, options = {}) {
    const iconWrapper = document.getElementById('payment-status-icon-wrapper');
    const icon = document.getElementById('payment-status-icon');
    const title = document.getElementById('payment-status-title');
    const subtitle = document.getElementById('payment-status-subtitle');
    const message = document.getElementById('payment-status-message');
    const note = document.getElementById('payment-status-note');
    const actions = document.getElementById('payment-status-actions');

    if (!iconWrapper || !icon || !title || !subtitle || !message || !note || !actions) {
        return;
    }

    const pendingLink = options.initPoint || getPendingPaymentLink();
    const statusMap = {
        default: {
            iconName: 'check-circle',
            iconColor: 'text-brand-green',
            iconWrapperClass: 'bg-brand-green/20',
            title: '¡Gracias por tu compra!',
            subtitle: 'Tu pedido ha sido procesado con éxito.',
            message: 'Nos pondremos en contacto contigo a la brevedad para coordinar la entrega de tu libro.',
            noteType: 'instagram',
            actions: [
                { label: 'Volver a la página principal', icon: 'home', action: 'show-page', variant: 'primary' },
            ],
        },
        redirecting: {
            iconName: 'wallet',
            iconColor: 'text-[#009EE3]',
            iconWrapperClass: 'bg-[#009EE3]/15',
            title: 'Te estamos redirigiendo',
            subtitle: 'Abrimos Mercado Pago en una nueva pestaña.',
            message: 'Completá el pago y luego regresá a esta página. Si no se abrió automáticamente, podés intentarlo de nuevo desde el botón de abajo.',
            noteText: 'Tu carrito queda guardado hasta que el pago se apruebe.',
            actions: [
                { label: 'Ir a pagar', icon: 'external-link', action: 'open-external', href: pendingLink, variant: 'info' },
                { label: 'Seguir navegando', icon: 'home', action: 'show-page', variant: 'secondary' },
            ],
        },
        approved: {
            iconName: 'check-circle',
            iconColor: 'text-brand-green',
            iconWrapperClass: 'bg-brand-green/20',
            title: '¡Pago aprobado!',
            subtitle: 'Mercado Pago confirmó tu compra.',
            message: 'En contados minutos te llegará un correo electrónico con el detalle del pedido y los próximos pasos de envío o retiro.',
            noteType: 'email',
            actions: [
                { label: 'Volver a la página principal', icon: 'home', action: 'show-page', variant: 'primary' },
            ],
        },
        pending: {
            iconName: 'clock-3',
            iconColor: 'text-amber-500',
            iconWrapperClass: 'bg-amber-100',
            title: 'Pago pendiente',
            subtitle: 'Mercado Pago todavía está procesando la operación.',
            message: 'Tu carrito sigue guardado. Podés esperar la confirmación o volver a abrir el enlace de pago si todavía lo necesitás.',
            noteText: 'Cuando Mercado Pago confirme el cobro, vas a recibir el email automático de la compra.',
            actions: [
                ...(pendingLink ? [{ label: 'Ver pago', icon: 'refresh-cw', action: 'open-external', href: pendingLink, variant: 'warning' }] : []),
                { label: 'Volver a la tienda', icon: 'home', action: 'show-page', variant: 'secondary' },
            ],
        },
        failure: {
            iconName: 'x-circle',
            iconColor: 'text-red-500',
            iconWrapperClass: 'bg-red-100',
            title: 'El pago no se completó',
            subtitle: 'No pudimos confirmar la compra en Mercado Pago.',
            message: 'Tu carrito sigue guardado para que no pierdas la compra. Podés reintentar el pago o volver a la tienda.',
            noteText: 'Si el problema persiste, probá con otro medio de pago o escribinos para ayudarte.',
            actions: [
                ...(pendingLink ? [{ label: 'Reintentar pago', icon: 'refresh-cw', action: 'open-external', href: pendingLink, variant: 'primary' }] : []),
                { label: 'Volver a la tienda', icon: 'home', action: 'show-page', variant: 'secondary' },
            ],
        },
        cash: {
            iconName: 'badge-check',
            iconColor: 'text-brand-green',
            iconWrapperClass: 'bg-brand-green/20',
            title: '¡Pedido recibido!',
            subtitle: 'Te abrimos WhatsApp para coordinar el retiro.',
            message: 'Conservamos tu pedido y en breve seguimos la coordinación por mensaje.',
            noteType: 'whatsapp',
            actions: [
                { label: 'Volver a la página principal', icon: 'home', action: 'show-page', variant: 'primary' },
            ],
        },
    };

    const currentState = statusMap[state] || statusMap.default;

    iconWrapper.className = `w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${currentState.iconWrapperClass}`;
    icon.setAttribute('data-lucide', currentState.iconName);
    icon.className = `w-12 h-12 ${currentState.iconColor}`;
    title.textContent = currentState.title;
    subtitle.textContent = currentState.subtitle;
    message.textContent = currentState.message;
    setPaymentStatusNote(note, currentState);
    setPaymentStatusActions(actions, currentState);
    lucide.createIcons();
}

function adjustProductQuantity(change) {
    const qtyEl = document.getElementById('product-qty');
    if (!qtyEl) {
        return;
    }

    const currentValue = parseInt(qtyEl.textContent, 10) || 1;
    const nextValue = Math.max(1, currentValue + change);
    qtyEl.textContent = String(nextValue);
}

function hydrateSiteConfig() {
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogUrl) {
        ogUrl.setAttribute('content', SITE_CONFIG.siteUrl);
    }
    if (ogImage) {
        ogImage.setAttribute('content', `${SITE_CONFIG.siteUrl}${SITE_CONFIG.ogImagePath}`);
    }

    document.querySelectorAll('[data-config-link="instagram"]').forEach((link) => {
        link.href = SITE_CONFIG.instagramUrl;
    });
    document.querySelectorAll('[data-config-link="email"]').forEach((link) => {
        link.href = `mailto:${SITE_CONFIG.contactEmail}`;
    });
    document.querySelectorAll('[data-config-link="whatsapp"]').forEach((link) => {
        link.href = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
    });

    const legalEmail = document.getElementById('legal-contact-email');
    const legalWhatsapp = document.getElementById('legal-contact-whatsapp');
    const legalSite = document.getElementById('legal-contact-site');
    if (legalEmail) legalEmail.textContent = SITE_CONFIG.contactEmail;
    if (legalWhatsapp) legalWhatsapp.textContent = SITE_CONFIG.whatsappDisplay;
    if (legalSite) legalSite.textContent = SITE_CONFIG.siteUrl;
}

function handleActionClick(target, event) {
    const action = target.dataset.action;
    if (!action) {
        return;
    }

    switch (action) {
        case 'show-page': {
            event.preventDefault();
            showPage(target.dataset.page || 'home-view');
            if (target.dataset.scrollTop === 'true') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (target.dataset.scrollTarget) {
                setTimeout(() => scrollToTarget(target.dataset.scrollTarget), 320);
            }
            break;
        }
        case 'toggle-cart':
            toggleCart();
            break;
        case 'toggle-menu':
            toggleMenu();
            break;
        case 'go-to-store':
            toggleCart(false);
            openProductModal();
            break;
        case 'open-checkout':
            openCheckoutModal();
            break;
        case 'close-modal':
            closeModal();
            break;
        case 'open-product':
            openProductModal();
            break;
        case 'open-modal':
            openModal(target.dataset.modal);
            break;
        case 'toggle-faq':
            toggleFaq(target);
            break;
        case 'close-product':
            closeProductModal();
            break;
        case 'open-book-details':
            openBookDetails();
            break;
        case 'adjust-product-qty':
            adjustProductQuantity(Number(target.dataset.change || '0'));
            break;
        case 'add-to-cart-with-qty':
            addToCartWithQty();
            break;
        case 'calculate-shipping':
            calculateShipping(event);
            break;
        case 'open-legales-from-modal':
            event.preventDefault();
            closeModal();
            showPage('legales-view');
            break;
        case 'read-more-product':
            closeModal();
            openProductModal();
            break;
        case 'open-external': {
            const href = target.dataset.href;
            if (href) {
                window.open(href, '_blank');
            }
            break;
        }
        default:
            break;
    }
}

document.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) {
        handleActionClick(actionTarget, event);
    }
});

window.addEventListener('scroll', updateNavbar);

window.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    updateMobileMenuButton();
    hydrateSiteConfig();
    lucide.createIcons();

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');

    setPaymentStatusView('default');

    if (paymentStatus === 'approved') {
        if (typeof clearCart === 'function') {
            clearCart();
        }
        clearPendingPaymentState();
        setTimeout(() => {
            setPaymentStatusView('approved');
            showPage('success-view');
            history.replaceState(null, '', `${window.location.pathname}#success`);
        }, 300);
    } else if (paymentStatus === 'failure') {
        setTimeout(() => {
            setPaymentStatusView('failure');
            showPage('success-view');
            history.replaceState(null, '', `${window.location.pathname}#success`);
        }, 300);
    } else if (paymentStatus === 'pending') {
        setTimeout(() => {
            setPaymentStatusView('pending');
            showPage('success-view');
            history.replaceState(null, '', `${window.location.pathname}#success`);
        }, 300);
    }
});

window.addEventListener('popstate', () => {
    const hash = window.location.hash;

    if (!hash || hash === '') {
        if (!modal.classList.contains('pointer-events-none')) closeModal(true);
        if (typeof isCartOpen !== 'undefined' && isCartOpen) toggleCart(false);
        if (typeof isProductModalOpen !== 'undefined' && isProductModalOpen) closeProductModal(true);
    } else if (hash === '#carrito') {
        if (!modal.classList.contains('pointer-events-none')) closeModal(true);
        if (typeof isCartOpen !== 'undefined' && !isCartOpen) toggleCart(true);
        if (typeof isProductModalOpen !== 'undefined' && isProductModalOpen) closeProductModal(true);
    } else if (hash === '#producto') {
        if (!modal.classList.contains('pointer-events-none')) closeModal(true);
        if (typeof isCartOpen !== 'undefined' && isCartOpen) toggleCart(false);
        if (typeof isProductModalOpen === 'undefined' || !isProductModalOpen) openProductModal();
    }
});

function toggleFaq(btn) {
    const content = btn.nextElementSibling;
    const icon = btn.querySelector('i');

    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        content.style.maxHeight = '0px';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = `${content.scrollHeight}px`;
        icon.style.transform = 'rotate(180deg)';
    }
}
