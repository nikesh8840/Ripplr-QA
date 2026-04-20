/**
 * Onboarding – Salesman Management Locators
 * List URL:  /onboarding/salesman
 * Add  URL:  /onboarding/salesman/add
 *
 * Form field IDs are stable native-input IDs exposed by the AntD / rc-select component.
 */
const createSalesmanLocators = (page) => ({

    // ── Navigation ──────────────────────────────────────────────────────────────
    onboardingMenu:       page.getByRole('menuitem', { name: 'Onboarding' }),
    salesmanLink:         page.getByRole('link', { name: 'Salesman', exact: true }),
    addSalesmanButton:    page.getByRole('button', { name: /Add Salesman/i }),

    // ── Add Salesman form ───────────────────────────────────────────────────────
    nameInput:            page.locator('input#name'),
    codeInput:            page.locator('input#code'),
    mobileInput:          page.locator('input#mobile'),

    // FC:Brands — AntD Select; internal input receives keyboard events
    // The dropdown popup is identified by aria-owns="brand_id_list"
    fcBrandsInput:        page.locator('input#brand_id'),
    fcBrandsList:         page.locator('#brand_id_list'),

    // ── Submit ─────────────────────────────────────────────────────────────────
    saveButton:           page.getByRole('button', { name: 'Save' }),

    // ── List page – search & verify ────────────────────────────────────────────
    searchByMobileInput:  page.getByPlaceholder('Search by Mobile Number'),
    searchButton:         page.getByRole('button', { name: 'Search' }),
    tableBody:            page.locator('table tbody'),
    rowByMobile:          (mobile) => page.locator('table tbody tr').filter({ hasText: mobile }),
    rowByCode:            (code)   => page.locator('table tbody tr').filter({ hasText: code }),
});

module.exports = createSalesmanLocators;
