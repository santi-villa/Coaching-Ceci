const zipnovaService = require('./zipnova-service');

async function quoteHomeDelivery(params) {
    return zipnovaService.quoteHomeDelivery(params);
}

async function createShipment(params) {
    return zipnovaService.createShipment(params);
}

async function getTracking(params) {
    return zipnovaService.getTracking(params);
}

async function getLabel(params) {
    return zipnovaService.getLabel(params);
}

module.exports = {
    createShipment,
    getLabel,
    getTracking,
    quoteHomeDelivery
};
