'use strict';

const AzureServiceFactory = {
    SERVICE_IDS: {
        USER_INFO: 'azure.http.userinfo'
    },
    ACTIONS: {
        USER_INFO: 'USER_INFO'
    },

    /* ***************************************************
     * Build requestContainer helpers
     * ************************************************* */
    /**
     * builds request container for Azure UserInfo api call
     * @param {Object} requestParams request parameter object
     * @returns {Object} the request container
     */
    buildGetUserInfoRequestContainer: function (requestParams) {
        return {
            requestMethod: 'POST',
            action: AzureServiceFactory.ACTIONS.USER_INFO,
            headers: {
                Authorization: 'Bearer ' + requestParams.accessToken
            }
        };
    }
};

module.exports = AzureServiceFactory;
