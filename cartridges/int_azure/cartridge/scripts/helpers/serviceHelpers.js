'use strict';

const SVC_FILTER_KEYS = require('*/cartridge/scripts/util/serviceFilterKeys');

/**
 * encodes form data value
 * @param {string} value - value
 * @returns {string} request value
 */
function encodeFormPostValue(value) {
    return encodeURIComponent(value).replace(/\'/g, '%27'); // eslint-disable-line no-useless-escape
}

const ServiceHelpers = {
    OK_STATUS_CODES: [200],

    /**
     * get service url from credential
     * @param {dw.svc.Service} service - the service class
     * @returns {string} the service url
     */
    getServiceUrl: function (service) {
        var serviceURL = null;

        try {
            var serviceConfiguration = service.getConfiguration();
            var serviceCredential = serviceConfiguration ? serviceConfiguration.getCredential() : null;
            serviceURL = serviceCredential && serviceCredential.getURL() ? serviceCredential.getURL() : null;
        } catch (ex) {
            throw new Error('Cannot get Credential or Configuration object');
        }

        return serviceURL;
    },

    /**
     * appends path to service url
     * @param {dw.svc.Service} service - the service class
     * @param {string} path - the path to append
     */
    appendUrlPath: function (service, path) {
        if (!service || !path) return;

        var serviceURL = ServiceHelpers.getServiceUrl(service);
        if (!serviceURL) return;

        if (serviceURL[serviceURL.length - 1] === '/') {
            serviceURL = serviceURL.slice(0, -1);
        }
        service.setURL(serviceURL + '/' + path);
    },

    /**
     * appends querystring parameters to the service url
     * @param {dw.svc.Service} service - the service class
     * @param {Object} urlParams - the request params
     */
    appendQuerystringParams: function (service, urlParams) {
        if (!service || !urlParams || Object.keys(urlParams).length === 0) return;

        var serviceURL = ServiceHelpers.getServiceUrl(service);
        if (!serviceURL) return;

        var qs = [];
        Object.keys(urlParams).forEach(function (fieldName) {
            if (urlParams[fieldName]) {
                var value = encodeFormPostValue(urlParams[fieldName]);
                if (value !== 'null') {
                    qs.push(fieldName + '=' + value);
                }
            }
        });

        serviceURL += (serviceURL.indexOf('?') !== -1 ? '&' : '?') + qs.join('&');
        service.setURL(serviceURL);
    },

    /**
     * append params to the service request
     * @param {dw.svc.Service} service - service
     * @param {Object} requestData - the request params
     */
    appendParams: function (service, requestData) {
        if (service && requestData && Object.keys(requestData).length) {
            Object.keys(requestData).forEach(function (fieldName) {
                if (requestData[fieldName]) {
                    service.addParam(fieldName, requestData[fieldName]);
                }
            });
        }
    },

    /**
     * build generic form post
     * @param {Object} requestData - the request container
     * @returns {string} encoded data string
     */
    buildFormPostRequest: function (requestData) {
        if (!requestData || Object.keys(requestData).length === 0) {
            return '';
        }

        var formData = [];
        Object.keys(requestData).forEach(function (key) {
            if (Object.hasOwnProperty.call(requestData, key)) {
                var value = encodeFormPostValue(requestData[key]);
                if (value !== 'null') {
                    formData.push(key + '=' + value);
                }
            }
        });

        return formData.join('&');
    },

    /**
     * generic JSON parser function
     * @param {Object} serviceResponse - the object returned from the service
     * @returns {Object} plain javascript object
     */
    parseJsonResponse: function (serviceResponse) {
        var Logger = require('dw/system/Logger');
        var result = {
            success: false,
            responseObject: null
        };

        try {
            if (serviceResponse && Object.hasOwnProperty.call(serviceResponse, 'text')) {
                var responseText = serviceResponse.text;
                var responseObject = JSON.parse(responseText);

                if (!responseObject) {
                    throw new Error('Failure Response : ' + serviceResponse.text);
                }

                result.success = true;
                result.responseObject = responseObject;
            }
        } catch (ex) {
            Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
        }

        return result;
    },

    /**
     * generic Array parser function
     * @param {Object} serviceResponse - the object returned from the service
     * @returns {Object} plain javascript object
     */
    parseArrayResponse: function (serviceResponse) {
        var Logger = require('dw/system/Logger');
        var result = {
            success: false
        };

        try {
            if (ServiceHelpers.OK_STATUS_CODES.indexOf(serviceResponse.getStatusCode()) > -1 && serviceResponse.getStatusMessage() === 'OK') {
                result.success = true;
            }
        } catch (ex) {
            Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
        }

        return result;
    },

    /**
     * generic text parser function
     * @param {Object} serviceResponse - the object returned from the service
     * @returns {Object} plain javascript object
     */
    parseTextResponse: function (serviceResponse) {
        var Logger = require('dw/system/Logger');
        var result = {
            success: false,
            responseText: null
        };

        if (!serviceResponse) {
            return result;
        }

        try {
            if (ServiceHelpers.OK_STATUS_CODES.indexOf(serviceResponse.statusCode) > -1 && serviceResponse.statusMessage === 'OK') {
                result.success = true;
            }
            if (serviceResponse.text) {
                result.responseText = serviceResponse.text;
            }
        } catch (ex) {
            Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
        }

        return result;
    },

    prepareFormLogData: function (data) {
        if (!data) return '';

        var result = '\n';
        var params = data.split('&');
        params.forEach(function (param) {
            var paramArr = param.split('=');
            var key = paramArr[0];
            var value = paramArr.length > 1 ? paramArr[1] : null;
            if (key !== null) {
                if (key && SVC_FILTER_KEYS.FILTER_KEYS.indexOf(String(key).toLowerCase()) > -1) {
                    value = '*****';
                }
                if (value !== null) {
                    result += decodeURIComponent(key + '=' + value) + '\n';
                } else {
                    result += decodeURIComponent(key) + '\n';
                }
            }
        });

        return result;
    },

    prepareXmlLogData: function (data) {
        var filteredData = data;
        SVC_FILTER_KEYS.FILTER_KEYS.forEach((key) => {
            filteredData = filteredData.replace(new RegExp('(<' + key + '>)(.*)(</' + key + '>)', 'gm'), '<' + key + '>********</' + key + '>');
            filteredData = filteredData.replace(new RegExp('(<custom-attribute attribute-id="' + key + '">)(.*)(</custom-attribute>)', 'gm'), '<custom-attribute attribute-id="' + key + '">********</custom-attribute>');
        });
        return filteredData;
    },

    forEachIn: function (iterable, functionRef) {
        Object.keys(iterable).forEach(function (key) {
            functionRef(key, iterable[key]);
        });
    },

    isArray: function (element) {
        return element.constructor === Array;
    },

    isObject: function (element) {
        return element.constructor === Object;
    },

    isIterable: function (element) {
        if (!element) return false;
        return ServiceHelpers.isArray(element) || ServiceHelpers.isObject(element);
    },

    iterate: function (object, parent) {
        if (ServiceHelpers.isIterable(object)) {
            ServiceHelpers.forEachIn(object, function (key, value) {
                if (key !== null) {
                    if (SVC_FILTER_KEYS.FILTER_KEYS.indexOf(String(key).toLowerCase()) > -1) {
                        value = '*****'; // eslint-disable-line no-param-reassign
                        object[key] = value; // eslint-disable-line no-param-reassign
                    }
                }
                ServiceHelpers.iterate(value, parent);
            });
        }
        return object;
    },

    /**
     * returns SOAP string value if the soap element exists
     * @param {Object} soapValue - the soap value
     * @returns {string} soap string value
     */
    getSoapString: function (soapValue) {
        var StringUtils = require('dw/util/StringUtils');
        return soapValue ? StringUtils.trim(soapValue.toString()) : null;
    },

    /**
     * takes a camel case string ands adds spaces
     * @param {string} camelCaseString - the camel cased string
     * @returns {string} the split string
     */
    splitCamelCase: function (camelCaseString) {
        if (!camelCaseString) return null;
        return camelCaseString.replace(/([a-z])([A-Z])/g, '$1 $2');
    },

    json2xml: function (o) {
        var lines = function (str) {
            var newString = str.replace(/\r\n/g, '\n');
            return newString;
        };
        var makeSafe = function (str) {
            var newString = str.replace(/</g, '&lt;').replace(/&/g, '&amp;');
            return lines(newString);
        };
        var toXml = function (v, name, ind) {
            var xml = '';
            if (v instanceof Array) {
                for (var i = 0, n = v.length; i < n; i++) {
                    xml += toXml(v[i], name, ind + '');
                }
            } else if (typeof (v) === 'object') {
                var hasChild = false;
                xml += ind + '<' + name;
                for (var m in v) { // eslint-disable-line no-restricted-syntax
                    if (m.charAt(0) === '@') {
                        xml += ' ' + m.substr(1) + '="' + v[m].toString() + '"';
                    } else {
                        hasChild = true;
                    }
                }
                xml += hasChild ? '>\n' : '/>';
                if (hasChild) {
                    for (var mc in v) { // eslint-disable-line no-restricted-syntax
                        if (mc === '#text') {
                            xml += makeSafe(v[mc]);
                        } else if (mc === '#cdata') {
                            xml += '<![CDATA[' + lines(v[mc]) + ']]>';
                        } else if (mc.charAt(0) !== '@') {
                            xml += toXml(v[mc], mc, ind + '\t');
                        }
                    }
                    xml += (xml.charAt(xml.length - 1) === '\n' ? ind : '') + '</' + name + '>\n';
                }
            } else {
                xml += ind + '<' + name + '>' + makeSafe(v.toString()) + '</' + name + '>\n';
            }
            return xml;
        };
        var xml = '';
        for (var xm in o) { // eslint-disable-line
            xml += toXml(o[xm], xm, '');
        }
        return xml;
    }
};

module.exports = ServiceHelpers;
