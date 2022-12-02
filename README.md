# SFCC B2C OAuth

## Support

### :warning: PLEASE READ BEFORE USING THIS CARTRIDGE :warning: ###

This cartridge is maintained by the **Salesforce Community**. Salesforce Commerce Cloud and Salesforce Platform Technical Support do not support this project or its setup. Enhancements and defect resolution will be driven by the Salesforce Community. You are invited to [log an issue](https://github.com/sandragolden/sfcc-azure-oauth/issues/new/choose) or [submit a pull-request](https://github.com/sandragolden/sfcc-azure-oauth/compare) to advance this project.

----

## Overview

This cartridge is a proof of concept for integrating Microsoft Azure OAuth with Salesforce Commerce Cloud B2C.

Currently, `dw.customer.oauth.OAuthLoginFlowMgr` does not support passing the access token in the header, which Azure's [UserInfo](https://learn.microsoft.com/en-us/azure/active-directory/develop/userinfo) endpoint requires.
Instead of calling `OAuthLoginFlowMgr.finalizeOAuthLogin()`, we will call `OAuthLoginFlowMgr.obtainAccessToken()`,
and then make a custom HTTP call to the [UserInfo](https://learn.microsoft.com/en-us/azure/active-directory/develop/userinfo) endpoint.

This cartridge also includes an ***optional*** feature to merge external profiles with existing customer accounts. This will ensure if you have existing SFCC shopper accounts, the external profile will be added to the existing account, rather than creating a new customer profile, allowing for order history and profile data to accessed from the same login.

## Cartridge Installation

**Note**: Requires minimum compatibility mode 21.2.

### Install and Upload the Cartridge

1. Clone this repository. The name of the top-level directory is `sfcc-azure-oauth`.
2. From the `sfcc-azure-oauth` directory, run `npm install`. This command installs all the package dependencies.
3. Create a `dw.json` file in the root directory of the repository. Providing a [WebDAV access key from BM](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fadmin%2Fb2c_access_keys_for_business_manager.html) in the `password` field is optional, as you will be prompted if it is not provided.
```json
{
    "hostname": "your-sandbox-hostname.commercecloud.salesforce.com",
    "username": "AM username like me.myself@company.com",
    "password": "your_webdav_access_key",
    "code-version": "version_to_upload_to"
}
```
4. Enter the following command: `npm run uploadCartridge`.

For more information on uploading the cartridge, see the following topic on the B2C Commerce Infocenter: [Upload Code for SFRA](https://documentation.b2c.commercecloud.salesforce.com/DOC2/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fsfra%2Fb2c_uploading_code.html).

### Configuration

#### Update Cartridge Path

This plugin requires the `app_storefront_base` cartridge.

1. Log in to Business Manager.
2. Go to **Administration** > **Sites** > **Manage Sites**.
3. Select the site that you want to use Azure Login.
4. Click the **Settings** tab.
5. In the **Cartridges** field, add the new cartridge path: `int_azure`. It must be added _before_ the path for `app_storefront_base`. Example path: `int_azure:app_storefront_base`

#### Import Main Data

1. Zip the [data/site_template_azure](data/site_template_azure) folder: `npm run data:zip:main`
2. Go to **Administration** > **Site Development** > **Site Import & Export**.
3. Click **Browse**
4. Select the `site_template_azure.zip` file
5. Click **Upload**.
6. Select `site_template_azure.zip`
7. Click **Import**.

#### Update OAuth Client ID and Client Secret

For help setting up your Azure Client ID and Client Secret, please refer to the following documenation:
1. [Application types for the Microsoft identity platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-app-types)
2. [Quickstart: Register an application](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

Once you have established your `Client ID` and `Client Secret Value`, update the values in Business Manager:
1. Go to **Administration** > **Global Preferences** > **OAuth2 Providers** > **Azure**
2. Update Client ID
3. Update Client Secret
4. Click **Apply**

![Azure OAuth Provider](docs/images/azure-oauth-provider.png)

#### Update `enableMergeExternalAccounts` Site Preference (optional)

If you wish to have external accounts merged with SFCC shopper accounts, enable the `enableMergeExternalAccounts` site preference:

1. Go to **Merchant Tools** > **Site Preferences** > **Custom Site Preference Groups**
2. Click the **ExternalAccounts** Label
3. Select **Yes**
4. Click **Save**

## Contributing

### Lint and Build your code

Before committing code to this project, please run the following scripts and ensure they run without error.
1. `npm run lint`

## License

Licensed under the current NDA and licensing agreement in place with your organization. (This is explicitly **not** open source licensing.)

### Support

**This project should not be treated as Salesforce Product.** It is a tool and strategy for B2C projects. Customers and partners implement this at-will with no expectation of roadmap, technical support, defect resolution, production-style SLAs.

This project is maintained by the **Salesforce Community**. Salesforce Commerce Cloud or Salesforce Platform Technical Support do not support this project or its setup.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

For feature requests or bugs, please open a [GitHub issue](https://github.com/sandragolden/sfcc-azure-oauth/issues).
