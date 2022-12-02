'use strict';

const mockedResponses = require('~/cartridge/scripts/azure/tests/data/mockedResponses');
const MOCK_SUCCESS = true;

/**
 * set mock text
 * @param {Object} jsonObject - the object to stringify
 * @returns {string} stringified JSON object
 */
function setMockText(jsonObject) {
    if (!jsonObject || !Object.keys(jsonObject).length) return '';
    jsonObject.isMocked = true; // eslint-disable-line no-param-reassign
    return JSON.stringify(jsonObject);
}

const AzureMockService = {
    getUserInfoResponse: function () {
        if (MOCK_SUCCESS) {
            return {
                statusCode: 200,
                statusMessage: 'OK',
                text: setMockText(mockedResponses.azureUserInfo.success)
            };
        }
        return {
            statusCode: 401,
            statusMessage: 'ERROR',
            errorText: setMockText(mockedResponses.azureUserInfo.error)
        };
    }
};

module.exports = AzureMockService;
