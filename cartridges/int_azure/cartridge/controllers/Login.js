'use strict';

const server = require('server');
server.extend(module.superModule);

const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Login-OAuthReentryAzure : This endpoint is called by the External OAuth Login Provider Azure
 * Currently, OAuthLoginFlowMgr does not support passing access token in the header; this doesn’t work for providers like Azure.
 * Instead of calling OAuthLoginFlowMgr.finalizeOAuthLogin(), we will call OAuthLoginFlowMgr.obtainAccessToken(),
 * and then make a custom HTTP call to the user information endpoint
 * @name Base/Login-OAuthReentryAzure
 * @function
 * @memberof Login
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - code - given by facebook
 * @param {querystringparameter} - state - given by facebook
 * @param {category} - sensitive
 * @param {renders} - isml only if there is a error
 * @param {serverfunction} - get
 */
server.get('OAuthReentryAzure', server.middleware.https, consentTracking.consent, function (req, res, next) {
    const CustomerMgr = require('dw/customer/CustomerMgr');
    const HookMgr = require('dw/system/HookMgr');
    const OAuthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
    const Resource = require('dw/web/Resource');
    const Transaction = require('dw/system/Transaction');
    const AzureModel = require('*/cartridge/models/azureModel');
    const externalAuthHelpers = require('*/cartridge/scripts/helpers/externalAuthHelpers');

    var destination = req.session.privacyCache.store.oauthLoginTargetEndPoint;
    var errorMessage = Resource.msg('error.oauth.login.failure', 'login', null);
    var template = '/error';

    var accessTokenResult = OAuthLoginFlowMgr.obtainAccessToken();
    if (!accessTokenResult) {
        res.render(template, { message: errorMessage });
        return next();
    }

    var accessToken = accessTokenResult.accessToken;
    var oauthProviderId = accessTokenResult.oauthProviderId;
    if (!accessToken || !oauthProviderId) {
        res.render(template, { message: errorMessage });
        return next();
    }

    var userInfoResponse = AzureModel.getUserInfo(accessToken);
    if (!userInfoResponse || !userInfoResponse.success) {
        res.render(template, { message: errorMessage });
        return next();
    }

    var externalProfile = userInfoResponse.responseObject || null;
    if (!externalProfile) {
        res.render(template, { message: errorMessage });
        return next();
    }

    var userId = externalProfile.sub;
    if (!userId) {
        res.render(template, { message: errorMessage });
        return next();
    }

    const profileInfo = {
        userId: userId,
        email: externalProfile.email,
        firstName: externalProfile.given_name,
        lastName: externalProfile.family_name
    };

    var customerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(oauthProviderId, userId);
    if (!customerProfile) {
        customerProfile = externalAuthHelpers.createExternalCustomer(userId, oauthProviderId, profileInfo);
    }

    if (!customerProfile) {
        res.render(template, { message: errorMessage });
        return next();
    }

    var credentials = customerProfile.getCredentials();
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(oauthProviderId, userId, false);
        });

        if (HookMgr.hasHook('app.customer.loggedIn')) {
            HookMgr.callHook(
                'app.customer.loggedIn',
                'loggedIn'
            );
        }
    } else {
        res.render('/error', { message: errorMessage });
        return next();
    }

    req.session.privacyCache.clear();
    req.session.privacyCache.set('oauthProviderID', oauthProviderId);

    res.redirect(destination);

    return next();
});

module.exports = server.exports();
