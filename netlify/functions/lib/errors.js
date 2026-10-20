// ValidationError: el mensaje es seguro y util para mostrarle a la persona.
// ProviderError: fallo de un servicio externo (Zipnova, Mercado Pago); el detalle solo va al log.
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class ProviderError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ProviderError';
    }
}

const PROVIDER_ERROR_MESSAGE = 'No pudimos calcular el envio en este momento. Revisa el codigo postal y la localidad, o intenta de nuevo en unos minutos.';

function toErrorResponse(error, { providerMessage = PROVIDER_ERROR_MESSAGE } = {}) {
    if (error instanceof ValidationError) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    const message = error instanceof ProviderError
        ? providerMessage
        : 'Ocurrio un error inesperado. Intenta de nuevo en unos minutos.';
    return { statusCode: error instanceof ProviderError ? 502 : 500, body: JSON.stringify({ error: message }) };
}

module.exports = { ValidationError, ProviderError, toErrorResponse };
