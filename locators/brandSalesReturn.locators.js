/**
 * Brand Sales Return Locators
 * URL: /order-management/brand-sales-returns
 * Detail URL: /order-management/brand-sales-return/:id/show
 */
const brandSalesReturnLocators = (page) => ({

    // ── Navigation ────────────────────────────────────────────────────────────
    orderManagementMenu:    page.getByRole('menuitem', { name: 'Order Management' }),
    brandSalesReturnLink:   page.getByRole('link', { name: 'Brand Sales Return' }),

    // ── Filters ───────────────────────────────────────────────────────────────
    searchByReturnNoInput:  page.getByPlaceholder('Search by Return No'),
    searchByInvoiceNoInput: page.getByPlaceholder('Search by Invoice No'),
    fcCombobox:             page.getByRole('combobox', { name: /FC\(s\) Select FC\(s\)/i }),
    brandsCombobox:         page.getByRole('combobox', { name: 'Brands' }),
    quidDeliveriesSwitch:   page.getByRole('switch', { name: 'Quid Deliveries' }),
    searchButton:           page.getByRole('button', { name: 'Search' }),

    // ── Table ─────────────────────────────────────────────────────────────────
    tableBody:              page.locator('table tbody'),
    firstRow:               page.locator('table tbody tr').first(),
    firstRowEditIcon:       page.locator('table tbody tr').first()
                                .locator('a').filter({ has: page.locator('img[alt="edit-icon"]') }),
    editLinkNth:    (n)     => page.locator('table tbody tr').nth(n)
                                .locator('a').filter({ has: page.locator('img[alt="edit-icon"]') }),

    // ── Pagination ────────────────────────────────────────────────────────────
    prevPageButton:         page.getByRole('button', { name: 'left' }),
    nextPageButton:         page.getByRole('button', { name: 'right' }),
    pageSizeCombobox:       page.getByRole('combobox', { name: 'Page Size' }),
});

module.exports = brandSalesReturnLocators;
