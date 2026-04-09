/**
 * Onboarding – User Management Locators
 * List URL:   /onboarding/user
 * Add URL:    /onboarding/user/add
 * Edit URL:   /onboarding/user/:id/edit
 *
 * NOTE: createUser.locators.js covers the Add User FORM fields.
 *       This file covers list search + navigation for all onboarding sub-pages.
 */
const onboardingUserLocators = (page) => ({

    // ── Navigation – Onboarding menu + sub-links ──────────────────────────────
    onboardingMenu:         page.getByRole('menuitem', { name: 'Onboarding' }),
    companyLink:            page.getByRole('link', { name: 'Company' }),
    clientLink:             page.getByRole('link', { name: 'Client' }),
    brandLink:              page.getByRole('link', { name: 'Brand' }),
    fcLink:                 page.getByRole('link', { name: 'FC' }),
    storeLink:              page.getByRole('link', { name: 'Store' }),
    storeCategoryLink:      page.getByRole('link', { name: 'Store Category' }),
    userLink:               page.getByRole('link', { name: 'User' }),
    salesmanLink:           page.getByRole('link', { name: 'Salesman' }),

    // ── User List – Filters ───────────────────────────────────────────────────
    groupCombobox:          page.getByRole('combobox', { name: /Group\(s\)/i }),
    fcCombobox:             page.getByRole('combobox', { name: /Select FC\(s\)/i }),
    searchByEmailInput:     page.getByPlaceholder('Search by email'),
    searchByNameInput:      page.getByPlaceholder('Search by name'),
    searchByMobileInput:    page.getByPlaceholder('Search by mobile number'),
    searchButton:           page.getByRole('button', { name: 'Search' }),

    // ── User List – Actions ───────────────────────────────────────────────────
    addUserButton:          page.getByRole('button', { name: /Add User/i }),

    // ── User List – Table ─────────────────────────────────────────────────────
    tableBody:              page.locator('table tbody'),
    firstRow:               page.locator('table tbody tr').first(),
    // Columns: Full Name, Email, Mobile No, FC, Brands, Groups, Created At, Emp ID, (edit)
    userRowByEmail: (email) => page.locator(`table tbody tr:has-text("${email}")`),
    editLinkNth:    (n)     => page.locator('table tbody tr').nth(n).locator('a[href*="/edit"]'),

    // ── Pagination ────────────────────────────────────────────────────────────
    prevPageButton:         page.getByRole('button', { name: 'left' }),
    nextPageButton:         page.getByRole('button', { name: 'right' }),
    pageSizeCombobox:       page.getByRole('combobox', { name: 'Page Size' }),
});

module.exports = onboardingUserLocators;
