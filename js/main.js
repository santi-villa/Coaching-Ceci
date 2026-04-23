const mainNav = document.getElementById('main-nav');

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

window.addEventListener('scroll', updateNavbar);
updateNavbar();

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');
let menuOpen = false;

function toggleMenu() {
    menuOpen = !menuOpen;
    if (menuOpen) {
        mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
        mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
        mobileMenuBtn.innerHTML = '<i data-lucide="x" class="w-8 h-8 drop-shadow-md"></i>';
    } else {
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenuBtn.innerHTML = '<i data-lucide="menu" class="w-8 h-8 drop-shadow-md"></i>';
    }
    lucide.createIcons();
}

mobileMenuBtn.addEventListener('click', toggleMenu);
mobileLinks.forEach(link => {
    link.addEventListener('click', () => { if (menuOpen) toggleMenu(); });
});

const modal = document.getElementById('action-modal');
const modalCard = document.getElementById('modal-card');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const modalIcon = document.getElementById('modal-icon');

function openModal(type) {
    const data = modalData[type];
    modalTitle.textContent = data.title;
    modalContent.innerHTML = data.content;
    modalIcon.innerHTML = `<i data-lucide="${data.icon}" class="w-8 h-8"></i>`;
    lucide.createIcons({ root: modalIcon });

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
    setTimeout(() => { modalCard.classList.remove('scale-95'); modalCard.classList.add('scale-100'); }, 10);
    document.body.style.overflow = 'hidden';
}

function closeModal(forceState = null) {
    if (typeof forceState !== 'boolean' && forceState !== null) {
        forceState = null;
    }

    if (forceState === true) {
        _closeModal();
    } else {
        if (window.location.hash) {
            window.history.back(); // Popstate hará el forceState = true
        } else {
            _closeModal();
        }
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

        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) closeBtn.className = 'absolute -top-3 -right-3 md:top-4 md:right-4 bg-white/95 text-gray-600 hover:text-brand-text hover:bg-gray-100 border border-gray-200 transition p-2.5 rounded-full z-20 shadow-md';

        const subsMsg = document.getElementById('subs-msg');
        const subsBtn = document.getElementById('subs-btn');
        if (subsMsg) subsMsg.classList.add('hidden');
        if (subsBtn) {
            subsBtn.disabled = false;
            subsBtn.innerHTML = 'Suscribirse <i data-lucide="send" class="w-4 h-4"></i>';
            subsBtn.className = 'w-full bg-brand-text text-white py-3.5 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg flex items-center justify-center gap-2';
        }

        lucide.createIcons();
    }, 200);
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

let isProductModalOpen = false;

function openProductModal() {
    isProductModalOpen = true;
    const view = document.getElementById('product-view');
    const card = document.getElementById('product-modal-card');
    
    if (window.location.hash !== '#producto') {
        window.history.pushState(null, '', '#producto');
    }

    view.classList.remove('opacity-0', 'pointer-events-none');
    view.classList.add('opacity-100', 'pointer-events-auto');
    setTimeout(() => { card.classList.remove('scale-95'); card.classList.add('scale-100'); }, 10);
    document.body.style.overflow = 'hidden';
}

function closeProductModal(forceState = null) {
    if (typeof forceState !== 'boolean' && forceState !== null) {
        forceState = null;
    }

    if (forceState === true) {
        _closeProductModal();
    } else {
        if (window.location.hash) {
            window.history.back(); // Popstate hará el forceState = true
        } else {
            _closeProductModal();
        }
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
    }, 300);
}

function showPage(pageId) {
    const currentView = document.querySelector('.view-section.block') || document.querySelector('.view-section:not(.hidden)');
    const targetView = document.getElementById(pageId);

    if (currentView === targetView) return;

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

    if (menuOpen) toggleMenu();
}

function openBookDetails() {
    const title = 'Contraportada';
    const content = bookContent.back;

    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modalIcon.innerHTML = '<i data-lucide="book-open" class="w-8 h-8"></i>';

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    setTimeout(() => { modalCard.classList.remove('scale-95'); modalCard.classList.add('scale-100'); }, 10);
    document.body.style.overflow = 'hidden';
    lucide.createIcons({ root: modalIcon });
}

lucide.createIcons();

window.addEventListener('DOMContentLoaded', () => {
    // Leemos los parámetros que Mercado Pago pone en la URL al volver
    const urlParams = new URLSearchParams(window.location.search);

    // Si el estado es aprobado...
    if (urlParams.get('status') === 'approved') {
        // Mostramos el pop-up de éxito que reemplaza el flujo de WPP.
        setTimeout(() => {
            openModal('success');
            // Reemplazamos la url base sacando param pero manteniendo el hash modal
            history.replaceState(null, '', window.location.pathname + '#success');
        }, 300);
    }
});

// Listener global para el botón "Atrás" del celular/navegador y cierre cruzado
window.addEventListener('popstate', () => {
    const hash = window.location.hash;
    
    if (!hash || hash === '') {
        // Cierra todo al volver al principio
        if (!modal.classList.contains('pointer-events-none')) closeModal(true);
        if (typeof isCartOpen !== 'undefined' && isCartOpen) toggleCart(false);
        if (typeof isProductModalOpen !== 'undefined' && isProductModalOpen) closeProductModal(true);
    } else if (hash === '#carrito') {
        // Si retrocedemos desde el checkout al carrito, cerramos solo el checkout
        if (!modal.classList.contains('pointer-events-none')) closeModal(true);
        // Y por si no estaba abierto, lo forzamos abiertamente
        if (typeof isCartOpen !== 'undefined' && !isCartOpen) toggleCart(true);
        // Cerramos el de producto para que no quede abajo
        if (typeof isProductModalOpen !== 'undefined' && isProductModalOpen) closeProductModal(true);
    } else if (hash === '#producto') {
        if (!modal.classList.contains('pointer-events-none')) closeModal(true);
        if (typeof isCartOpen !== 'undefined' && isCartOpen) toggleCart(false);
        if (typeof isProductModalOpen === 'undefined' || !isProductModalOpen) openProductModal();
    }
});