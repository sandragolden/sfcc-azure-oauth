'use strict';

/**
 * Model for Azure Services
 * @module models/azureModel
 */

/* Script Modules */
const Logger = require('dw/system/Logger').getLogger('AZURE_API');
const serviceFactory = require('*/cartridge/scripts/azure/util/serviceFactory');
const serviceMgr = require('*/cartridge/scripts/azure/services/serviceMgr');

const AzureModel = ({
    /**
     * Return Azure UserInfo response for access token
     * @param {string} accessToken - OAuth Access Token
     * @returns {Object} service response object
     */
    getUserInfo: function (accessToken) {
        var result = {
            success: false,
            responseObject: null
        };

        try {
            if (!accessToken) return result;
            const requestContainer = serviceFactory.buildGetUserInfoRequestContainer({ accessToken: accessToken });
            const azureService = serviceMgr.getService(serviceFactory.SERVICE_IDS.USER_INFO);
            var serviceResult = azureService.call(requestContainer);
            var serviceObject = serviceResult ? serviceResult.getObject() : null;
            if (serviceResult.isOk() && serviceObject && serviceObject.responseObject) {
                result.success = true;
                result.responseObject = serviceObject.responseObject;
            }
        } catch (e) {
            Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        }
        return result;
    }
});

module.exports = AzureModel;
