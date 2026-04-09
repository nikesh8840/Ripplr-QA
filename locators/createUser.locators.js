const createUserLocators = (page) => ({
    // --- Navigation ---
    onboardingMenu:         page.getByRole('menuitem', { name: 'Onboarding' }),
    userMenuLink:           page.getByRole('link', { name: 'User', exact: true }),
    addUserButton:          page.getByRole('button', { name: 'Add User' }),

    // --- User Type ---
    userTypeDropdown:       page.getByRole('combobox', { name: '*User Type' }),
    userTypeOption:         (type) => page.locator('.ant-select-item-option-content', { hasText: type }),

    // --- Personal Details ---
    firstNameInput:         page.getByRole('textbox', { name: '*First Name' }),
    lastNameInput:          page.getByRole('textbox', { name: '*Last Name' }),
    empIdInput:             page.getByRole('textbox', { name: '*Emp ID' }),
    phoneNumberInput:       page.getByRole('textbox', { name: '*Phone Number' }),

    // --- Work Details ---
    emailInput:             page.getByRole('textbox', { name: '*Email' }),
    passwordInput:          page.getByRole('textbox', { name: '*Password' }),

    // --- FC:Brands ---
    fcBrandsDropdown:       page.getByRole('combobox', { name: 'FC:Brands(s)' }),

    // --- Submit ---
    saveButton:             page.getByRole('button', { name: 'Save' }),

    // --- User list (verification after creation) ---
    searchByEmailInput:     page.getByRole('textbox', { name: 'Search by email' }),
    searchButton:           page.getByRole('button', { name: 'Search' }),
    userTableBody:          page.locator('table tbody'),
    userRowByEmail:         (email) => page.locator('table tbody tr').filter({ hasText: email }),
});

module.exports = createUserLocators;
