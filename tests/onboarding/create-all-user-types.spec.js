const { test, expect } = require('@playwright/test');
const config = require('../../config/base.config');
const { CreateUserPage } = require('../../pages/createUser.page');

/**
 * Onboarding – Create All User Types
 * npx playwright test
 * tests/onboarding/create-all-user-types.spec.js --headed
 * npx playwright test tests/onboarding/create-all-user-types.spec.js --headed -g "Segregator"
 *
 * One test per user type. Each test exercises the full flow:
 *   navigate → fill Add User form → save → verify in user list
 *
 * Reference implementation: createTransportManager.spec.js
 * (Transport Manager flow is the same generic flow used here for every type)
 *
 * Discovered user types (as of 2026-04-13, cdms-preprod.ripplr.in):
 *   Additional Resource | Billing Executive | Cashier | Delivery Boy
 *   Fc Incharge | Fc Manager | Finance | Picking | Ripplr | Sales Officer
 *   Salesman | Segregator | Support Team | System Admin | Transport Manager | View Access
 */

// Unique timestamp per run — keeps email / empId unique across retries
const ts = Date.now();

// Helper to build a unique 10-digit phone number (Indian format: starts with 9)
const phone = (offset = 0) => `9${String(ts + offset).slice(-9)}`;

// ── User type test definitions ────────────────────────────────────────────────
// Each entry maps directly to one test. Add / remove as user types change.
// FC and Brand to use for the FC:Brands(s) field.
// The dropdown option appears as "<FC>: <Brand>" (e.g. "BTML: Britannia").
// We search by brand name — partial hasText match finds the right option.
const FC_BRAND = 'Britannia';   // search term; maps to BTML: Britannia in the dropdown

const USER_TYPE_CASES = [
    {
        userType:    'Additional Resource',
        prefix:      'AR',
        phoneOffset: 0,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Billing Executive',
        prefix:      'BE',
        phoneOffset: 1,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Cashier',
        prefix:      'CA',
        phoneOffset: 2,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Delivery Boy',
        prefix:      'DB',
        phoneOffset: 3,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Fc Incharge',
        prefix:      'FI',
        phoneOffset: 4,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Fc Manager',
        prefix:      'FM',
        phoneOffset: 5,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Finance',
        prefix:      'FN',
        phoneOffset: 6,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Picking',
        prefix:      'PK',
        phoneOffset: 7,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Ripplr',
        prefix:      'RP',
        phoneOffset: 8,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Sales Officer',
        prefix:      'SO',
        phoneOffset: 9,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Salesman',
        prefix:      'SM',
        phoneOffset: 10,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Segregator',
        prefix:      'SG',
        phoneOffset: 11,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Support Team',
        prefix:      'ST',
        phoneOffset: 12,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'System Admin',
        prefix:      'SA',
        phoneOffset: 13,
        fcBrand:     FC_BRAND,
    },
    {
        userType:    'Transport Manager',
        prefix:      'TM',
        phoneOffset: 14,
        fcBrand:     FC_BRAND,
        // Reference: createTransportManager.spec.js — original flow used to
        // validate the full create-user journey.
    },
    {
        userType:    'View Access',
        prefix:      'VA',
        phoneOffset: 15,
        fcBrand:     FC_BRAND,
    },
];

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Onboarding – Create All User Types', () => {

    for (const { userType, prefix, phoneOffset, fcBrand } of USER_TYPE_CASES) {

        test(`Create "${userType}" user`, async ({ page }) => {
            test.setTimeout(120_000);

            const createUserPage = new CreateUserPage(page);

            const userData = {
                userType,
                firstName:   `Auto${prefix}`,
                lastName:    `User${ts}`,
                empId:       `${prefix}${ts + phoneOffset}`,
                phoneNumber: phone(phoneOffset),
                email:       `auto.${prefix.toLowerCase()}.${ts + phoneOffset}@ripplr.in`,
                password:    'Test@1234',
                fcBrand,
            };

            const result = await createUserPage.createTransportManager(
                config.baseURLpreprod,
                config.credentials.username,
                config.credentials.password,
                userData,
            );

            expect(result, `"${userType}" user should appear in the user list after creation`).toBeTruthy();
        });
    }

});
