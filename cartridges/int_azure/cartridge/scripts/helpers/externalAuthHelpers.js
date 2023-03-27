'use strict';

const Site = require('dw/system/Site');
const currentSite = Site.getCurrent();

/**
 * get site preference value by name
 * @param {string} name - site preference name
 * @returns {string} the site preference
 */
const getSitePreference = (name) => {
    if (!name || !currentSite || !currentSite.preferences) return null;
    var sitePrefValue = Object.hasOwnProperty.call(currentSite.preferences.custom, name) ? currentSite.getCustomPreferenceValue(name) : null;
    if (sitePrefValue && Object.hasOwnProperty.call(sitePrefValue, 'value')) {
        sitePrefValue = sitePrefValue.value;
    }
    return sitePrefValue;
};

/**
 * This function is used to create an externally authenticated customer
 * @param {string} userId - external provider user ID
 * @param {string} providerId - external provider ID
 * @param {Object} profileInfo - customer information
 * @param {string} profileInfo.email - customer email
 * @param {string} profileInfo.firstName - customer first name
 * @param {string} profileInfo.lastName - customer last name
 * @returns {dw.customer.Profile} customer profile
 */
const createExternalCustomer = (userId, providerId, profileInfo) => {
    const CustomerMgr = require('dw/customer/CustomerMgr');
    const Logger = require('dw/system/Logger');
    const Transaction = require('dw/system/Transaction');

    var email = profileInfo.email || null;
    if (!userId || !providerId || !email) return null;

    var customerProfile = null;
    var externalProfile = null;

    try {
        Transaction.wrap(function () {
            // if site preference is enabled, attempt to merge customer profile with existing profile
            if (getSitePreference('enableMergeExternalAccounts')) {
                Logger.debug(`User id: ${userId} not found, searching for customer profile using CustomerMgr.getCustomerByLogin: ${email}`);
                var customerByLogin = CustomerMgr.getCustomerByLogin(email);
                // if customer exists, create external profile
                if (customerByLogin) {
                    customerProfile = customerByLogin.getProfile();
                    externalProfile = customerByLogin.createExternalProfile(providerId, userId);
                } else {
                    Logger.debug(`User id: ${userId} not found, querying for customer profile using CustomerMgr.searchProfiles: ${email}`);
                    // search by email if login does not equal the email address
                    const profiles = CustomerMgr.searchProfiles('email = {0}', null, email).asList().toArray();
                    if (profiles.length) {
                        for (var i = 0; i < profiles.length; i++) {
                            var profile = profiles[i];
                            var credentials = profile.getCredentials();
                            if (credentials.isEnabled()) {
                                customerProfile = profile;
                                var customerFromProfile = customerProfile.getCustomer();
                                externalProfile = customerFromProfile.createExternalProfile(providerId, userId);
                                break;
                            }
                        }
                    }
                }
            }

            if (!externalProfile) {
                Logger.debug(`User id: ${userId} not found, creating a new customer.`);
                var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(providerId, userId);
                if (newCustomer) {
                    externalProfile = newCustomer.getExternalProfile(providerId, userId);
                    customerProfile = newCustomer.getProfile();
                }
            }

            if (externalProfile) {
                externalProfile.setEmail(email);
            }

            if (customerProfile && Object.keys(profileInfo).length) {
                Transaction.wrap(function () {
                    if (email) customerProfile.setEmail(email);
                    if (profileInfo.firstName) customerProfile.setFirstName(profileInfo.firstName);
                    if (profileInfo.lastName) customerProfile.setLastName(profileInfo.lastName);
                });
            }
        });
    } catch (e) {
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    return customerProfile;
};

module.exports = {
    createExternalCustomer: createExternalCustomer,
    getSitePreference: getSitePreference
};
