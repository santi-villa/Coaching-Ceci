const mainNav = document.getElementById('main-nav');

function isElementOpen(id, closedClasses = ['hidden', 'pointer-events-none']) {
    const element = document.getElementById(id);
    if (!element) return false;
    return !closedClasses.some(className => element.classList.contains(className));
}

function hasOpenOverlay() {
    return (
        isElementOpen('mobile-menu', ['pointer-events-none']) ||
        isElementOpen('action-modal', ['pointer-events-none']) ||
        isElementOpen('product-view', ['pointer-events-none']) ||
        isElementOpen('cart-overlay', ['hidden']) ||
        isElementOpen('mp-redirect-overlay', ['hidden'])
    );
}

function lockPageScroll() {
    document.documentElement.classList.add('page-scroll-locked');
    document.body.classList.add('page-scroll-locked');
}

function unlockPageScrollIfNoOverlay() {
    requestAnimationFrame(() => {
        if (!hasOpenOverlay()) {
            document.documentElement.classList.remove('page-scroll-locked');
            document.body.classList.remove('page-scroll-locked');
        }
    });
}

window.lockPageScroll = lockPageScroll;
window.unlockPageScrollIfNoOverlay = unlockPageScrollIfNoOverlay;

function updateNavbar() {
    const currentView = document.querySelector('.view-section.block')?.id || 'home-view';
    const scrolled = window.scrollY > 50;
    const brandSurname = document.getElementById('brand-surname');

    if (currentView !== 'home-view' || scrolled) {
        mainNav.classList.remove('nav-at-top');
        mainNav.classList.add('nav-scrolled');
        if (brandSurname) {
            brandSurname.classList.remove('text-brand-cream');
            brandSurname.classList.add('text-brand-pink');
        }
    } else {
        mainNav.classList.add('nav-at-top');
        mainNav.classList.remove('nav-scrolled');
        if (brandSurname) {
            brandSurname.classList.add('text-brand-pink');
        }
    }
}

window.addEventListener('scroll', updateNavbar);
updateNavbar();

const authorBookSelector = document.getElementById('author-book-selector');
const heroBookCarousel = authorBookSelector?.querySelector('.author-hero__books') || null;

function hydrateAuthorBookSelector() {
    if (!heroBookCarousel) return;

    bookCatalog.forEach((book, index) => {
        let card = heroBookCarousel.querySelector(`[data-hero-book-id="${book.id}"]`);
        if (!card) {
            card = document.createElement('button');
            card.type = 'button';
            card.className = 'author-hero__book author-hero__book--catalog';
            card.dataset.heroBookId = book.id;
            card.setAttribute('role', 'tab');
            card.innerHTML = `<img src="${book.image}" alt="${book.imageAlt}" decoding="async" loading="lazy">`;
            heroBookCarousel.appendChild(card);
        }
        card.style.setProperty('--book-index', index);
        card.setAttribute('aria-label', `Seleccionar ${book.title}`);
    });

    const dots = authorBookSelector.querySelector('.author-book-selector__dots');
    if (dots) {
        dots.replaceChildren(...bookCatalog.map((book, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'author-book-selector__dot';
            dot.dataset.authorBookDot = book.id;
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Elegir libro ${index + 1}: ${book.title}`);
            return dot;
        }));
    }
}

hydrateAuthorBookSelector();

const heroBookCards = Array.from(document.querySelectorAll('[data-hero-book-id]'));
const heroBookDots = Array.from(document.querySelectorAll('[data-author-book-dot]'));
const heroPrimaryButtons = Array.from(document.querySelectorAll('[data-hero-primary]'));
const heroAboutButtons = Array.from(document.querySelectorAll('[data-hero-about]'));
const heroCarouselStatus = document.getElementById('book-carousel-status');
const heroCopy = document.querySelector('.hero-copy');
const heroHeading = document.querySelector('.hero-heading');
let heroCopyAnimationTimer = null;
let activeProductCoverSide = 'front';
let productCoverLightboxOpen = false;
let productCoverLightboxReturnFocus = null;
let productModalCloseTimer = null;
let productModalReturnFocus = null;
let bookSelectorScrollFrame = null;

function renderHeroBook(book, announce = true) {
    const bookIndex = bookCatalog.findIndex(item => item.id === book.id);
    const eyebrow = document.getElementById('hero-eyebrow');
    const title = document.getElementById('hero-title');
    const kicker = document.getElementById('hero-kicker');
    const description = document.getElementById('hero-lede');

    if (eyebrow) eyebrow.textContent = book.heroEyebrow;
    if (title) title.innerHTML = book.heroTitleHtml;
    if (kicker) kicker.textContent = book.heroKicker;
    if (description) description.textContent = book.heroDescription;

    if (announce) {
        window.clearTimeout(heroCopyAnimationTimer);
        [heroCopy, heroHeading].forEach(el => {
            if (!el) return;
            el.classList.remove('is-book-changing');
            void el.offsetWidth;
            el.classList.add('is-book-changing');
        });
        heroCopyAnimationTimer = window.setTimeout(() => {
            heroCopy?.classList.remove('is-book-changing');
            heroHeading?.classList.remove('is-book-changing');
        }, 500);
    }

    const activeIndex = bookCatalog.findIndex(item => item.id === book.id);
    heroBookCards.forEach(card => {
        const cardIndex = bookCatalog.findIndex(item => item.id === card.dataset.heroBookId);
        const isActive = card.dataset.heroBookId === book.id;
        card.classList.toggle('is-active', isActive);
        card.classList.toggle('is-selected', isActive);
        card.classList.toggle('is-behind', !isActive);
        card.classList.toggle('is-behind-left', !isActive && cardIndex < activeIndex);
        card.classList.toggle('is-behind-right', !isActive && cardIndex > activeIndex);
        card.setAttribute('aria-selected', String(isActive));
        card.setAttribute('aria-pressed', String(isActive));
        card.tabIndex = isActive ? 0 : -1;
    });

    heroBookDots.forEach(dot => {
        const isActive = dot.dataset.authorBookDot === book.id;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
        dot.tabIndex = isActive ? 0 : -1;
    });

    const previousButton = document.querySelector('[data-book-prev]');
    const nextButton = document.querySelector('[data-book-next]');
    previousButton?.toggleAttribute('hidden', bookIndex <= 0);
    nextButton?.toggleAttribute('hidden', bookIndex >= bookCatalog.length - 1);

    heroPrimaryButtons.forEach(button => {
        button.innerHTML = book.available
            ? '<i data-lucide="shopping-bag" class="w-5 h-5"></i> Comprar libro físico'
            : '<i data-lucide="book-open" class="w-5 h-5"></i> Conocer libro';
        button.setAttribute('aria-label', book.available
            ? `Comprar ${book.title}`
            : `Ver detalles de ${book.title}`);
    });
    const selectedTitle = document.getElementById('author-book-selected-title');
    const selectedSubtitle = document.getElementById('author-book-selected-subtitle');
    const selectedPosition = document.getElementById('author-book-position');
    const selectedDetails = document.querySelector('[data-selected-book-detail]');
    if (selectedTitle) selectedTitle.textContent = book.title;
    if (selectedSubtitle) {
        selectedSubtitle.textContent = book.subtitle || '';
        selectedSubtitle.hidden = !book.subtitle;
    }
    if (selectedPosition) selectedPosition.textContent = `Libro ${bookIndex + 1} de ${bookCatalog.length}`;
    if (selectedDetails) selectedDetails.setAttribute('aria-label', `Ver detalles de ${book.title}`);

    const mobileBookTitle = document.getElementById('mobile-book-title');
    const mobileBookImage = document.getElementById('mobile-book-image');
    if (mobileBookTitle) mobileBookTitle.textContent = book.title;
    if (mobileBookImage) mobileBookImage.src = book.image;
    const mobilePrice = document.getElementById('mobile-book-price');
    const hasListedPrice = bookHasListedPrice(book);
    if (mobilePrice) {
        if (!hasListedPrice) {
            mobilePrice.innerHTML = '';
            mobilePrice.hidden = true;
        } else {
            const hasWebDiscount = Boolean(book.available && book.listPrice && book.listPrice > book.price);
            mobilePrice.hidden = false;
            mobilePrice.innerHTML = hasWebDiscount
                ? `<s>${book.listPriceLabel}</s> <strong>${book.priceLabel} ${book.currency}</strong>`
                : `<strong>${book.priceLabel} ${book.currency}</strong>`;
        }
    }
    const mobileBookStatus = document.getElementById('mobile-book-status');
    const mobileBookAvailability = document.querySelector('.mobile-book-availability');
    const mobileBookOpen = document.querySelector('[data-mobile-book-open]');
    const mobileBookAction = document.querySelector('[data-mobile-book-detail]');
    if (mobileBookStatus) mobileBookStatus.textContent = book.available ? '' : 'Próximamente';
    mobileBookAvailability?.classList.toggle('is-upcoming', !book.available);
    mobileBookAvailability?.classList.toggle('hidden', book.available);
    mobileBookOpen?.setAttribute('aria-label', `Ver detalles de ${book.title}`);
    if (mobileBookAction) {
        mobileBookAction.innerHTML = `<span>${book.available ? 'Comprar' : 'Ver detalles'}</span><i data-lucide="chevron-right" aria-hidden="true"></i>`;
        mobileBookAction.setAttribute('aria-label', book.available ? `Comprar ${book.title}` : `Ver ${book.title}`);
    }

    if (announce && heroCarouselStatus) {
        heroCarouselStatus.textContent = `Libro ${bookIndex + 1} de ${bookCatalog.length}: ${book.title}`;
    }

    lucide.createIcons();
}

function renderProductModal(book = getSelectedBook()) {
    const image = document.getElementById('book-front-img');
    const backImage = document.getElementById('book-back-img');
    const backCover = document.querySelector('#product-modal-card .book-back-cover');
    const zoomImage = document.getElementById('product-cover-lightbox-image');
    const zoomBackImage = document.getElementById('product-cover-lightbox-back-image');
    const zoomBackCover = document.getElementById('product-cover-lightbox-back');
    const zoomBackTitle = document.getElementById('product-cover-lightbox-title');
    const zoomBackCopy = document.getElementById('product-cover-lightbox-copy');
    const headerTitle = document.getElementById('product-header-title');
    const backTitle = document.getElementById('product-back-title');
    const backCopy = document.getElementById('product-back-copy');
    const kicker = document.getElementById('product-kicker');
    const title = document.getElementById('product-title');
    const author = document.getElementById('product-author');
    const description = document.getElementById('product-description');
    const format = document.getElementById('product-format');
    const pages = document.getElementById('product-pages');
    const size = document.getElementById('product-size');
    const binding = document.getElementById('product-binding');
    const paper = document.getElementById('product-paper');
    const language = document.getElementById('product-language');
    const price = document.getElementById('product-price');
    const listPrice = document.getElementById('product-list-price');
    const webBadge = document.getElementById('product-web-badge');
    const currency = document.getElementById('product-currency');
    const stock = document.getElementById('product-stock-pill');
    const quantityRow = document.getElementById('product-quantity-row');
    const purchaseCard = document.getElementById('product-purchase-card');
    const bookContainer = document.querySelector('#product-modal-card .book-container');
    const action = document.querySelector('.product-add-button');

    if (image) {
        image.classList.toggle('hidden', !book.image);
        if (book.image) {
            image.src = book.image;
            image.alt = book.imageAlt;
        } else {
            image.removeAttribute('src');
            image.alt = '';
        }
    }
    if (zoomImage) {
        zoomImage.classList.toggle('hidden', !book.image);
        if (book.image) {
            zoomImage.src = book.image;
            zoomImage.alt = `Portada ampliada de ${book.title}`;
        } else {
            zoomImage.removeAttribute('src');
            zoomImage.alt = '';
        }
    }
    if (backImage) {
        backImage.classList.toggle('hidden', !book.backImage);
        if (book.backImage) {
            backImage.src = book.backImage;
            backImage.alt = book.backImageAlt || `Contratapa de ${book.title}`;
        } else {
            backImage.removeAttribute('src');
            backImage.alt = '';
        }
    }
    backCover?.classList.toggle('has-back-image', Boolean(book.backImage));
    if (zoomBackImage) {
        zoomBackImage.classList.toggle('hidden', !book.backImage);
        if (book.backImage) {
            zoomBackImage.src = book.backImage;
            zoomBackImage.alt = book.backImageAlt || `Contratapa ampliada de ${book.title}`;
        } else {
            zoomBackImage.removeAttribute('src');
            zoomBackImage.alt = '';
        }
    }
    zoomBackCover?.classList.toggle('has-back-image', Boolean(book.backImage));
    if (kicker) kicker.textContent = book.productKicker;
    if (headerTitle) headerTitle.textContent = book.title;
    if (backTitle) backTitle.textContent = book.title;
    if (backCopy) backCopy.textContent = book.backCopy || book.productDescription;
    if (zoomBackTitle) zoomBackTitle.textContent = book.title;
    if (zoomBackCopy) zoomBackCopy.textContent = book.backCopy || book.productDescription;
    if (title) title.textContent = book.title;
    const subtitle = document.getElementById('product-subtitle');
    if (subtitle) {
        subtitle.textContent = book.subtitle || '';
        subtitle.hidden = !book.subtitle;
    }
    if (author) author.textContent = 'Por Cecilia Karina Rosso';
    if (description) {
        if (book.productDescriptionHtml) description.innerHTML = book.productDescriptionHtml;
        else description.innerHTML = book.productDescription ? `<p>${book.productDescription}</p>` : '';
    }
    const formatLabel = document.getElementById('product-format-label');
    if (formatLabel) formatLabel.textContent = book.meta.label || 'Formato';
    if (format) format.textContent = book.meta.value || book.meta.format || '';
    if (pages) pages.textContent = book.meta.pages;
    if (size) size.textContent = book.meta.size;
    if (binding) {
        binding.textContent = book.meta.binding || '';
        binding.closest('.product-meta-grid > div')?.toggleAttribute('hidden', !book.meta.binding);
    }
    if (paper) {
        paper.textContent = book.meta.paper || '';
        paper.closest('.product-meta-grid > div')?.toggleAttribute('hidden', !book.meta.paper);
    }
    if (language) {
        language.textContent = book.meta.language || '';
        language.closest('.product-meta-grid > div')?.toggleAttribute('hidden', !book.meta.language);
    }
    const hasListedPrice = bookHasListedPrice(book);
    document.getElementById('product-modal-card')?.classList.toggle('is-unpriced', !hasListedPrice);
    const priceBlock = document.querySelector('#product-modal-card .product-modal-price');
    if (priceBlock) priceBlock.hidden = !hasListedPrice;
    if (price) price.textContent = hasListedPrice ? book.priceLabel : '';
    const hasWebDiscount = Boolean(hasListedPrice && book.available && book.listPrice && book.listPrice > book.price);
    if (listPrice) {
        listPrice.textContent = hasWebDiscount ? (book.listPriceLabel || '') : '';
        listPrice.hidden = !hasWebDiscount;
    }
    if (webBadge) {
        webBadge.textContent = book.webDiscountLabel || 'Precio exclusivo web';
        webBadge.hidden = !hasWebDiscount;
    }
    if (currency) {
        currency.textContent = hasListedPrice ? (book.currency || '') : '';
        currency.classList.toggle('hidden', !hasListedPrice || !book.currency);
        currency.hidden = !hasListedPrice;
    }
    if (stock) {
        stock.hidden = book.available;
        stock.textContent = book.available ? '' : book.statusLabel;
        stock.classList.toggle('is-upcoming', !book.available);
    }
    if (quantityRow) quantityRow.classList.toggle('hidden', !book.available);
    if (purchaseCard) purchaseCard.classList.toggle('is-upcoming', !book.available);
    if (bookContainer) bookContainer.classList.toggle('is-upcoming-book', !book.available);
    if (action) {
        action.innerHTML = book.available
            ? '<i data-lucide="shopping-cart" class="w-5 h-5"></i> Agregar al carrito'
            : '<i data-lucide="bell" class="w-5 h-5"></i> Avisarme cuando esté disponible';
    }

    switchProductCover('front');

    const qty = document.getElementById('product-qty');
    if (qty) qty.textContent = '1';
    lucide.createIcons();
}

function switchProductCover(side = 'front') {
    const wrapper = document.querySelector('#product-modal-card .book-3d-wrapper');
    const isBack = side === 'back';
    const zoomTrigger = document.querySelector('[data-product-cover-zoom]');
    const book = getSelectedBook();
    activeProductCoverSide = isBack ? 'back' : 'front';
    wrapper?.classList.toggle('is-showing-back', isBack);

    if (zoomTrigger) {
        zoomTrigger.setAttribute('aria-label', `Ampliar ${isBack ? 'contratapa' : 'portada'} de ${book.title}`);
    }

    document.querySelectorAll('[data-product-cover-tab]').forEach(tab => {
        const isActive = tab.dataset.productCoverTab === side;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
    });
}

function openProductCoverLightbox() {
    const lightbox = document.getElementById('product-cover-lightbox');
    const image = document.getElementById('product-cover-lightbox-image');
    const back = document.getElementById('product-cover-lightbox-back');
    const caption = document.getElementById('product-cover-lightbox-heading');
    const closeButton = document.getElementById('product-cover-lightbox-close');
    const isBack = activeProductCoverSide === 'back';
    if (!lightbox || !image || !back) return;

    productCoverLightboxReturnFocus = document.querySelector('[data-product-cover-zoom]');
    productCoverLightboxOpen = true;
    const modalCard = document.getElementById('product-modal-card');
    if (modalCard) modalCard.inert = true;
    image.hidden = isBack;
    back.hidden = !isBack;
    if (caption) caption.textContent = isBack ? 'Contratapa ampliada' : 'Portada ampliada';
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('is-open');
    requestAnimationFrame(() => closeButton?.focus());
}

function closeProductCoverLightbox({ restoreFocus = true } = {}) {
    const lightbox = document.getElementById('product-cover-lightbox');
    if (!lightbox || !productCoverLightboxOpen) return;
    const returnFocus = productCoverLightboxReturnFocus;

    productCoverLightboxOpen = false;
    const modalCard = document.getElementById('product-modal-card');
    if (modalCard) modalCard.inert = false;
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.classList.remove('is-open');
    if (restoreFocus && returnFocus instanceof HTMLElement) {
        requestAnimationFrame(() => returnFocus.focus());
    }
    productCoverLightboxReturnFocus = null;
}

window.openProductCoverLightbox = openProductCoverLightbox;
window.closeProductCoverLightbox = closeProductCoverLightbox;

function selectBook(bookId, { announce = true } = {}) {
    const book = getBookById(bookId);
    if (!book) return;
    selectedBookId = book.id;
    syncProductInfo(book);
    renderHeroBook(book, announce);
    renderProductModal(book);
}

function moveBookSelection(direction) {
    const currentIndex = bookCatalog.findIndex(book => book.id === selectedBookId);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= bookCatalog.length) return;
    selectBook(bookCatalog[nextIndex].id);
}

heroBookCards.forEach(card => {
    card.addEventListener('click', event => {
        const bookId = card.dataset.heroBookId;
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        if (bookId === selectedBookId) {
            openProductModal(bookId);
            return;
        }
        if (isMobile) {
            selectBook(bookId);
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            return;
        }
        openProductModal(bookId);
    });
});

heroBookDots.forEach(dot => dot.addEventListener('click', () => {
    const bookId = dot.dataset.authorBookDot;
    selectBook(bookId);
    heroBookCards.find(card => card.dataset.heroBookId === bookId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}));
document.querySelector('[data-book-prev]')?.addEventListener('click', () => moveBookSelection(-1));
document.querySelector('[data-book-next]')?.addEventListener('click', () => moveBookSelection(1));

heroPrimaryButtons.forEach(button => button.addEventListener('click', () => {
    const book = getSelectedBook();
    if (book.available) addToCart(book.id);
    else openProductModal();
}));
document.querySelectorAll('[data-hero-details]').forEach(button => button.addEventListener('click', () => {
    openProductModal();
}));
document.querySelector('[data-selected-book-detail]')?.addEventListener('click', () => openProductModal());
document.querySelector('[data-mobile-book-open]')?.addEventListener('click', () => openProductModal());
document.querySelector('[data-mobile-book-detail]')?.addEventListener('click', () => {
    const book = getSelectedBook();
    if (book.available) addToCart(book.id);
    else openProductModal();
});
document.querySelector('.mobile-book-bar')?.addEventListener('click', event => {
    if (event.target.closest('button')) return;
    openProductModal();
});
heroAboutButtons.forEach(button => button.addEventListener('click', () => openModal('read')));

heroBookCarousel?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveBookSelection(-1);
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveBookSelection(1);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        openProductModal();
    }
});

function syncBookSelectionFromScroll() {
    bookSelectorScrollFrame = null;
    const selectorRect = heroBookCarousel.getBoundingClientRect();
    const selectorCenter = selectorRect.left + selectorRect.width / 2;
    const closestCard = heroBookCards.reduce((closest, card) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - selectorCenter);
        return !closest || distance < closest.distance ? { card, distance } : closest;
    }, null)?.card;

    if (closestCard && closestCard.dataset.heroBookId !== selectedBookId) {
        selectBook(closestCard.dataset.heroBookId);
    }
}

heroBookCarousel?.addEventListener('scroll', () => {
    if (!window.matchMedia('(max-width: 767px)').matches || bookSelectorScrollFrame !== null) return;
    bookSelectorScrollFrame = window.requestAnimationFrame(syncBookSelectionFromScroll);
}, { passive: true });

function handleProductPrimaryAction() {
    const book = getSelectedBook();
    if (book.available) {
        addToCartWithQty(book.id);
        return;
    }
    closeProductModal(true);
    setTimeout(() => openModal('subscribe'), 230);
}

window.selectBook = selectBook;
window.handleProductPrimaryAction = handleProductPrimaryAction;
selectBook(selectedBookId, { announce: false });

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
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileMenuBtn.setAttribute('aria-label', 'Cerrar menú de navegación');
        lockPageScroll();
    } else {
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        mobileMenuBtn.innerHTML = '<i data-lucide="menu" class="w-8 h-8 drop-shadow-md"></i>';
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
        unlockPageScrollIfNoOverlay();
    }
    lucide.createIcons();
}

mobileMenuBtn.addEventListener('click', toggleMenu);
mobileLinks.forEach(link => {
    link.addEventListener('click', () => { if (menuOpen) toggleMenu(); });
});
document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && isProductModalOpen && !productCoverLightboxOpen) {
        const card = document.getElementById('product-modal-card');
        const focusable = Array.from(card?.querySelectorAll(
            'button:not([disabled]):not([hidden]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []).filter(element => element.offsetParent !== null);
        if (focusable.length) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
        return;
    }
    if (event.key !== 'Escape') return;
    if (productCoverLightboxOpen) closeProductCoverLightbox();
    else if (menuOpen) toggleMenu();
    else if (isProductModalOpen) closeProductModal();
});
document.querySelectorAll('[data-product-cover-tab]').forEach(tab => {
    tab.addEventListener('click', () => switchProductCover(tab.dataset.productCoverTab));
});
document.getElementById('product-cover-lightbox')?.addEventListener('click', event => {
    if (event.target.id === 'product-cover-lightbox') closeProductCoverLightbox();
});

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getMessageStyle(type = 'success') {
    if (type === 'error') {
        return {
            icon: 'alert-circle',
            iconClass: 'text-red-500',
            classes: ['bg-red-50/95', 'border', 'border-red-200', 'text-red-900']
        };
    }
    if (type === 'warning') {
        return {
            icon: 'info',
            iconClass: 'text-brand-lilac',
            classes: ['bg-brand-pink/95', 'border', 'border-brand-lilac/30', 'text-brand-text']
        };
    }

    return {
        icon: 'check-circle',
        iconClass: 'text-brand-lilac',
        classes: ['bg-brand-cream/95', 'border', 'border-brand-lilac/20', 'text-brand-text']
    };
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-24 bottom-auto md:top-auto md:bottom-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-[90%] max-w-sm';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'transform transition-all duration-300 translate-y-full opacity-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-medium text-sm backdrop-blur-md';
    const style = getMessageStyle(type);
    toast.innerHTML = `<i data-lucide="${style.icon}" class="w-5 h-5 ${style.iconClass} shrink-0"></i> <span>${escapeHtml(message)}</span>`;
    toast.classList.add(...style.classes);

    container.appendChild(toast);
    if(typeof lucide !== 'undefined') lucide.createIcons({ root: toast });

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

function showUserMessage(message, type = 'error', options = {}) {
    const target = options.target ? document.getElementById(options.target) : null;
    if (!target) {
        showToast(message, type);
        return;
    }

    const style = getMessageStyle(type);
    target.className = 'mb-4 rounded-xl px-4 py-3 text-sm leading-relaxed flex items-start gap-3 shadow-sm transition-all duration-200';
    target.classList.add(...style.classes);
    target.innerHTML = `
        <i data-lucide="${style.icon}" class="w-5 h-5 ${style.iconClass} shrink-0 mt-0.5"></i>
        <span>${escapeHtml(message)}</span>
    `;
    target.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: target });
    if (options.scroll !== false) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function hideUserMessage(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.classList.add('hidden');
    target.innerHTML = '';
}

const modal = document.getElementById('action-modal');
const modalCard = document.getElementById('modal-card');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const modalIcon = document.getElementById('modal-icon');

function openModal(type) {
    const selectedBook = getSelectedBook();
    const data = type === 'read'
        ? {
            title: selectedBook.previewTitle,
            icon: 'book-open',
            content: `${selectedBook.previewHtml}
                <button onclick="closeModal(true); setTimeout(() => { openProductModal(); setTimeout(openBookDetails, 300); }, 300);" class="mt-4 w-full bg-brand-lilac text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition shadow-sm flex items-center justify-center gap-2">
                    Ver detalles del libro
                </button>`
        }
        : modalData[type];
    if (!data) return;
    modalTitle.textContent = data.title;
    modalContent.innerHTML = data.content;
    modalIcon.innerHTML = `<i data-lucide="${data.icon}" class="w-8 h-8"></i>`;
    lucide.createIcons({ root: modalIcon });
    lucide.createIcons({ root: modalContent });

    modalCard.classList.remove('max-w-lg', 'max-w-xl', 'max-w-2xl', 'is-checkout-modal');
    modalCard.classList.add('max-w-lg');

    goToLayer(`#${type}`);

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    setTimeout(() => { modalCard.classList.remove('scale-95'); modalCard.classList.add('scale-100'); }, 10);
    lockPageScroll();
}

const LAYER_HASHES = ['#producto', '#carrito', '#checkout', '#detalles', '#read', '#subscribe'];
const SECTION_IDS = ['los-libros', 'coleccion', 'libro', 'autora', 'preguntas-frecuentes', 'newsletter', 'contacto'];

function isLayerHash(hash = window.location.hash) {
    return LAYER_HASHES.includes(hash);
}

function locationWithoutHash() {
    return window.location.pathname + window.location.search;
}

function stripLayerHash() {
    if (!isLayerHash()) return;
    window.history.replaceState(null, '', locationWithoutHash());
}

function goToLayer(hash) {
    if (!hash) {
        window.history.replaceState(null, '', locationWithoutHash());
        return;
    }
    if (window.location.hash === hash) return;
    if (isLayerHash()) {
        window.history.replaceState(null, '', hash);
        return;
    }
    window.history.pushState(null, '', hash);
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
}

function handleSectionNavClick(event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = (link.getAttribute('href') || '').slice(1);
    if (id === 'legales') {
        event.preventDefault();
        dismissAllOverlays();
        showPage('legales-view');
        window.history.replaceState(null, '', locationWithoutHash());
        return;
    }
    if (!SECTION_IDS.includes(id)) return;
    event.preventDefault();
    dismissAllOverlays();
    const go = () => {
        scrollToSection(id);
        window.history.replaceState(null, '', locationWithoutHash());
    };
    const home = document.getElementById('home-view');
    const alreadyHome = home && home.classList.contains('block') && !home.classList.contains('hidden');
    if (alreadyHome) go();
    else window.setTimeout(go, 320);
}

function dismissAllOverlays({ keepCart = false } = {}) {
    if (isProductModalOpen) _closeProductModal();
    if (!modal.classList.contains('pointer-events-none')) _closeModal();
    if (!keepCart && typeof closeCartLayer === 'function') closeCartLayer();
}

window.goToLayer = goToLayer;
window.dismissAllOverlays = dismissAllOverlays;

function closeModal(forceState = null) {
    if (typeof forceState !== 'boolean' && forceState !== null) {
        forceState = null;
    }

    _closeModal();
    if (forceState !== true) stripLayerHash();
}

function _closeModal() {
    modal.classList.add('pointer-events-none');
    modalCard.classList.remove('scale-100');
    modalCard.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.remove('opacity-100', 'pointer-events-auto');
        modal.classList.add('opacity-0');
        
        unlockPageScrollIfNoOverlay();

        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) closeBtn.className = 'absolute -top-3 -right-3 md:top-4 md:right-4 bg-brand-cream/95 text-brand-text/70 hover:text-brand-text hover:bg-brand-cream border border-brand-lilac/20 transition p-2.5 rounded-xl z-20 shadow-md';

        const subsMsg = document.getElementById('subs-msg');
        const subsBtn = document.getElementById('subs-btn');
        if (subsMsg) subsMsg.classList.add('hidden');
        if (subsBtn) {
            subsBtn.disabled = false;
            subsBtn.innerHTML = 'Suscribirse <i data-lucide="send" class="w-4 h-4"></i>';
            subsBtn.className = 'w-full bg-brand-lilac text-brand-cream py-3.5 rounded-xl font-medium hover:bg-opacity-90 transition shadow-lg flex items-center justify-center gap-2';
        }

        lucide.createIcons();
    }, 200);
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

let isProductModalOpen = false;

function openProductModal(bookId = null) {
    if (bookId) selectBook(bookId, { announce: false });
    renderProductModal(getSelectedBook());
    dismissAllOverlays({ keepCart: false });
    if (!isProductModalOpen && document.activeElement instanceof HTMLElement) {
        productModalReturnFocus = document.activeElement;
    }
    isProductModalOpen = true;
    const view = document.getElementById('product-view');
    const card = document.getElementById('product-modal-card');
    window.clearTimeout(productModalCloseTimer);
    goToLayer('#producto');

    view.classList.remove('opacity-0', 'pointer-events-none');
    view.classList.add('opacity-100', 'pointer-events-auto');
    view.setAttribute('aria-hidden', 'false');
    document.body.classList.add('product-detail-open');
    setTimeout(() => {
        card.classList.remove('scale-95');
        card.classList.add('scale-100');
        card.querySelector('.product-modal-close')?.focus({ preventScroll: true });
    }, 10);
    lockPageScroll();
}

document.getElementById('product-view')?.addEventListener('click', event => {
    if (event.target.id === 'product-view') closeProductModal();
});

function closeProductModal(forceState = null) {
    if (typeof forceState !== 'boolean' && forceState !== null) {
        forceState = null;
    }

    if (!isProductModalOpen && forceState !== true) return;

    _closeProductModal();
    if (forceState !== true) stripLayerHash();
}

function _closeProductModal() {
    closeProductCoverLightbox({ restoreFocus: false });
    isProductModalOpen = false;
    const returnFocus = productModalReturnFocus;
    const view = document.getElementById('product-view');
    const card = document.getElementById('product-modal-card');
    view.classList.add('pointer-events-none');
    view.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('product-detail-open');
    card.classList.remove('scale-100');
    card.classList.add('scale-95');
    window.clearTimeout(productModalCloseTimer);
    productModalCloseTimer = window.setTimeout(() => {
        view.classList.remove('opacity-100', 'pointer-events-auto');
        view.classList.add('opacity-0');
        unlockPageScrollIfNoOverlay();
        if (returnFocus instanceof HTMLElement && returnFocus.isConnected) {
            returnFocus.focus({ preventScroll: true });
        }
        productModalReturnFocus = null;
    }, 200);
}

function showPage(pageId) {
    const currentView = document.querySelector('.view-section.block') || document.querySelector('.view-section:not(.hidden)');
    const targetView = document.getElementById(pageId);

    document.body.classList.toggle('checkout-active', pageId === 'checkout-view');

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
    const selectedBook = getSelectedBook();
    const title = selectedBook.aboutTitle;
    const content = selectedBook.aboutHtml;

    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modalIcon.innerHTML = '<i data-lucide="book-open" class="w-8 h-8"></i>';

    goToLayer('#detalles');

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    setTimeout(() => { modalCard.classList.remove('scale-95'); modalCard.classList.add('scale-100'); }, 10);
    lockPageScroll();
    lucide.createIcons({ root: modalIcon });
}

lucide.createIcons();

window.addEventListener('DOMContentLoaded', () => {
    // Leemos los parámetros que Mercado Pago pone en la URL al volver
    const urlParams = new URLSearchParams(window.location.search);

    const paymentStatus = urlParams.get('status');
    if (paymentStatus === 'approved') {
        setTimeout(() => {
            showPage('success-view');
            history.replaceState(null, '', window.location.pathname);
        }, 100);
    } else if (paymentStatus === 'failure' || paymentStatus === 'rejected') {
        setTimeout(() => {
            showToast('El pago no se completó. Podés intentar de nuevo cuando quieras.', 'error');
            history.replaceState(null, '', window.location.pathname);
        }, 100);
    } else if (paymentStatus === 'pending') {
        setTimeout(() => {
            showToast('Tu pago quedó pendiente. Te avisamos cuando se acredite.', 'warning');
            history.replaceState(null, '', window.location.pathname);
        }, 100);
    } else {
        const hash = window.location.hash;
        if (hash === '#producto') {
            setTimeout(() => {
                openProductModal();
            }, 100);
        } else if (hash === '#carrito') {
            setTimeout(() => {
                if (typeof toggleCart !== 'undefined') toggleCart(true);
            }, 100);
        } else if (hash === '#checkout') {
            setTimeout(() => {
                if (typeof openCheckoutPage === 'function') {
                    if (!cart.length) {
                        history.replaceState(null, '', window.location.pathname);
                        showToast('Agregá un libro al carrito para continuar el pago.', 'warning');
                    } else {
                        openCheckoutPage({ pushState: false });
                    }
                }
            }, 100);
        } else if (hash === '#legales') {
            setTimeout(() => {
                showPage('legales-view');
                history.replaceState(null, '', locationWithoutHash());
            }, 100);
        } else if (SECTION_IDS.includes(hash.slice(1))) {
            setTimeout(() => {
                scrollToSection(hash.slice(1));
                history.replaceState(null, '', locationWithoutHash());
            }, 100);
        }
    }
});

document.addEventListener('click', handleSectionNavClick);

// Listener global para el botón "Atrás" del celular/navegador y cierre cruzado
window.addEventListener('popstate', () => {
    const hash = window.location.hash;

    if (!isLayerHash(hash)) {
        dismissAllOverlays();
        if (document.getElementById('checkout-view')?.classList.contains('block')) showPage('home-view');
        const sectionId = hash.slice(1);
        if (sectionId && SECTION_IDS.includes(sectionId)) {
            scrollToSection(sectionId);
            window.history.replaceState(null, '', locationWithoutHash());
        }
        return;
    }

    if (hash === '#carrito') {
        if (document.getElementById('checkout-view')?.classList.contains('block')) showPage('home-view');
        if (!modal.classList.contains('pointer-events-none')) _closeModal();
        if (isProductModalOpen) _closeProductModal();
        if (typeof toggleCart === 'function' && !isCartOpen) toggleCart(true);
        return;
    }

    if (hash === '#producto') {
        if (!modal.classList.contains('pointer-events-none')) _closeModal();
        if (typeof closeCartLayer === 'function') closeCartLayer();
        if (document.getElementById('checkout-view')?.classList.contains('block')) showPage('home-view');
        if (!isProductModalOpen) openProductModal();
        return;
    }

    if (hash === '#checkout') {
        if (typeof openCheckoutPage === 'function') openCheckoutPage({ pushState: false });
        return;
    }

    dismissAllOverlays();
});

function toggleFaq(btn) {
    const content = btn.nextElementSibling;
    const chevron = btn.querySelector('.faq-chevron');
    const isOpen = Boolean(content.style.maxHeight && content.style.maxHeight !== '0px');
    
    if (isOpen) {
        content.style.maxHeight = '0px';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        btn.setAttribute('aria-expanded', 'false');
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
        btn.setAttribute('aria-expanded', 'true');
    }
}

function handleInlineSubscribeSubmit(event) {
    const form = event.currentTarget;
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const message = form.querySelector('.newsletter-message');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.classList.remove('has-error');
    if (!input || !emailRegex.test(input.value.trim())) {
        event.preventDefault();
        form.classList.add('has-error');
        if (message) message.textContent = 'Ingresá un correo electrónico válido.';
        input?.focus();
        return;
    }

    button.disabled = true;
    button.textContent = 'Enviando…';
    if (message) message.textContent = '';

    window.setTimeout(() => {
        button.textContent = '¡Gracias!';
        if (message) message.textContent = 'Revisá tu correo para confirmar la suscripción.';
        form.reset();
    }, 1200);
}

window.handleInlineSubscribeSubmit = handleInlineSubscribeSubmit;

function toggleBio() {
    openAuthorBiography();
}

function openAuthorBiography() {
    const dialog = document.getElementById('author-dialog');
    const copy = document.querySelector('.author-bio-story').cloneNode(true);
    const more = copy.querySelector('#author-bio-more');
    more.removeAttribute('id');
    more.classList.remove('hidden');
    document.getElementById('author-dialog-content').replaceChildren(...copy.childNodes);
    document.getElementById('toggle-bio-btn').setAttribute('aria-expanded', 'true');
    dialog.showModal();
    lockPageScroll();
}

document.getElementById('author-dialog').addEventListener('close', () => {
    document.getElementById('toggle-bio-btn').setAttribute('aria-expanded', 'false');
    unlockPageScrollIfNoOverlay();
    document.getElementById('toggle-bio-btn').focus();
});
