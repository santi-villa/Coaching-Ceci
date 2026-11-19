// Aviso de cookies: Microsoft Clarity (analitica) solo se carga si la persona acepta.
(function () {
    const STORAGE_KEY = 'analytics-consent';
    const CLARITY_ID = 'yfpp7r5940';

    function readChoice() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (error) { return null; }
    }

    function saveChoice(value) {
        try { localStorage.setItem(STORAGE_KEY, value); } catch (error) { /* sin storage: se vuelve a preguntar */ }
    }

    function loadClarity() {
        if (window.clarity) return;
        window.clarity = function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
        document.head.appendChild(script);
    }

    function showBanner() {
        const banner = document.createElement('div');
        banner.className = 'consent-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Aviso de cookies');
        banner.innerHTML = `
            <p>Usamos Microsoft Clarity para entender cómo se usa el sitio, solo si aceptás. <a href="legales.html">Más información</a></p>
            <div class="consent-banner__actions">
                <button type="button" data-consent="rejected" class="consent-banner__btn consent-banner__btn--ghost">Rechazar</button>
                <button type="button" data-consent="accepted" class="consent-banner__btn">Aceptar</button>
            </div>`;
        banner.addEventListener('click', (event) => {
            const choice = event.target.closest('[data-consent]')?.dataset.consent;
            if (!choice) return;
            saveChoice(choice);
            banner.remove();
            if (choice === 'accepted') loadClarity();
        });
        document.body.appendChild(banner);
    }

    const choice = readChoice();
    if (choice === 'accepted') loadClarity();
    else if (choice !== 'rejected') {
        if (document.body) showBanner();
        else document.addEventListener('DOMContentLoaded', showBanner);
    }
})();
