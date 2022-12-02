'use strict';

/* API Modules */
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/* Script Modules */
const serviceConfig = require('*/cartridge/scripts/azure/services/serviceConfig');

/**
 * Returns a newly initialized service related to the given {serviceID}
 * If the service does not exist, this method will throw an error
 * @param {string} serviceId - the service id
 * @returns {Object} service object
 */
module.exports.getService = function (serviceId) {
    return LocalServiceRegistry.createService(serviceId, serviceConfig.AzureConfig);
};
