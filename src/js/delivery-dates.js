// Fecha estimada de entrega a partir del plazo en dias habiles que informa el transportista.
(function (root) {
    const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    function addBusinessDays(from, days) {
        const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        let remaining = Math.max(0, Math.trunc(days));
        while (remaining > 0) {
            date.setDate(date.getDate() + 1);
            const weekday = date.getDay();
            if (weekday !== 0 && weekday !== 6) remaining -= 1;
        }
        return date;
    }

    function formatDay(date) {
        return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
    }

    // "entre el 3 y el 7 de nov" (o "el 3 de nov" si ambos extremos coinciden). '' si faltan datos.
    function describeDeliveryRange(minDays, maxDays, from = new Date()) {
        const min = Number(minDays);
        const max = Number(maxDays);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) return '';

        const start = addBusinessDays(from, min);
        const end = addBusinessDays(from, max);
        if (start.getTime() === end.getTime()) return `el ${formatDay(start)}`;
        if (start.getMonth() === end.getMonth()) return `entre el ${start.getDate()} y el ${formatDay(end)}`;
        return `entre el ${formatDay(start)} y el ${formatDay(end)}`;
    }

    const api = { addBusinessDays, describeDeliveryRange };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.DeliveryDates = api;
})(typeof window !== 'undefined' ? window : globalThis);
