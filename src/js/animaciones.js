// Animaciones suaves de la home: aparicion al hacer scroll y "pop" del carrito.
// Si la persona pidio menos movimiento en su sistema, no se anima nada.
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setupReveal() {
        if (reduceMotion || !('IntersectionObserver' in window)) return;

        const targets = document.querySelectorAll([
            '#home-view .author-books-heading',
            '#home-view .author-book-entry',
            '#home-view .shared-view-heading',
            '#home-view .shared-view-grid > *',
            '#home-view .shared-view-closing',
            '#autora > .max-w-6xl',
            '#home-view .faq-heading',
            '#home-view .newsletter-panel'
        ].join(', '));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        });

        targets.forEach(element => {
            if (element.getBoundingClientRect().top < window.innerHeight) return;
            element.classList.add('reveal');
            observer.observe(element);
        });
    }

    function setupMobileBookBar() {
        const bar = document.querySelector('.mobile-book-bar');
        const primaryAction = document.getElementById('hero-actions');
        const newsletter = document.getElementById('newsletter');
        if (!bar || !primaryAction || !newsletter || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(() => {
            const action = primaryAction.getBoundingClientRect();
            const end = newsletter.getBoundingClientRect();
            bar.hidden = action.height === 0 || action.bottom > 0 || end.top < window.innerHeight;
        });
        observer.observe(primaryAction);
        observer.observe(newsletter);
    }

    function setupCartBadge() {
        const badge = document.getElementById('cart-badge');
        if (!badge || reduceMotion || !('MutationObserver' in window)) return;
        let last = badge.textContent;
        new MutationObserver(() => {
            if (badge.textContent === last) return;
            last = badge.textContent;
            badge.classList.remove('is-bumping');
            void badge.offsetWidth; // reinicia la animacion
            badge.classList.add('is-bumping');
        }).observe(badge, { childList: true, characterData: true, subtree: true });
    }

    // Header: marca la seccion que se esta viendo (en la pildora y en el menu del celular).
    function setupActiveSection() {
        if (!('IntersectionObserver' in window)) return;
        const ids = ['coleccion', 'autora', 'preguntas-frecuentes'];
        const links = ids.map((id) => [...document.querySelectorAll(`#main-nav a[href="#${id}"], #mobile-menu a[href="#${id}"]`)]);
        const sections = ids.map((id) => document.getElementById(id));
        const visible = new Map();

        function paint() {
            let current = -1;
            sections.forEach((section, i) => { if (visible.get(section)) current = i; });
            links.forEach((group, i) => group.forEach((a) => {
                if (i === current) a.setAttribute('aria-current', 'true');
                else a.removeAttribute('aria-current');
            }));
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
            paint();
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach((section) => section && observer.observe(section));
    }

    // Header: se esconde al bajar y vuelve al subir, para dejar mas espacio de lectura.
    function setupHideOnScroll() {
        const nav = document.getElementById('main-nav');
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (!nav || reduceMotion) return;
        let lastY = window.scrollY;
        let ticking = false;

        function update() {
            const y = window.scrollY;
            const menuOpen = menuBtn && menuBtn.getAttribute('aria-expanded') === 'true';
            const overlayOpen = document.body.classList.contains('cart-open') || document.body.classList.contains('product-detail-open');
            if (menuOpen || overlayOpen || y < 320 || y < lastY - 4) nav.classList.remove('nav-hidden');
            else if (y > lastY + 4) nav.classList.add('nav-hidden');
            if (Math.abs(y - lastY) > 4) lastY = y;
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        nav.addEventListener('focusin', () => nav.classList.remove('nav-hidden'));
    }

    function init() {
        setupReveal();
        setupCartBadge();
        setupMobileBookBar();
        setupActiveSection();
        setupHideOnScroll();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
