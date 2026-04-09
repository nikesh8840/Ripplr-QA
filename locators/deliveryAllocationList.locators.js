/**
 * Delivery Allocation LIST page locators
 * URL: /logistics-management/delivery-allocation
 *
 * NOTE: For the CREATE / vehicle form locators, see vehicleAllocation.locators.js
 */
const deliveryAllocationListLocators = (page) => ({

    // ── Navigation ────────────────────────────────────────────────────────────
    logisticsManagementMenu:     page.getByRole('menuitem', { name: 'Logistics Management' }),
    deliveryAllocationLink:      page.getByRole('link', { name: 'Delivery Allocation' }),

    // ── Filters ───────────────────────────────────────────────────────────────
    searchByVehicleNoInput:      page.getByPlaceholder('Search by Vehicle No'),
    fcCombobox:                  page.getByRole('combobox', { name: /FC\(s\) Select FC\(s\)/i }),
    brandsCombobox:              page.getByRole('combobox', { name: 'Brands' }),
    selectDateInput:             page.getByPlaceholder('Select Date'),
    searchButton:                page.getByRole('button', { name: 'Search' }),

    // ── Page Actions ──────────────────────────────────────────────────────────
    createDeliveryAllocationButton: page.getByRole('button', { name: 'Create Delivery Allocation' }),

    // ── Table ─────────────────────────────────────────────────────────────────
    tableBody:                   page.locator('table tbody'),
    firstRow:                    page.locator('table tbody tr').first(),
    // Columns: Vehicle No, Allocated Date, FC, Vendor, Driver Name, Delivery Boy,
    //          Status, Total order, Full/Partial Delivery, Cancelled, Attempted, Pending, (actions), INV, Retry
    firstRowVehicleNo:           page.locator('table tbody tr').first().locator('td').nth(0),
    firstRowAllocatedDate:       page.locator('table tbody tr').first().locator('td').nth(1),
    firstRowStatus:              page.locator('table tbody tr').first().locator('td').nth(6),
    firstRowViewLink:            page.locator('table tbody tr').first()
                                     .locator('a[href*="/delivery-allocation/"]').first(),
    firstRowEditIcon:            page.locator('table tbody tr').first().locator('img[alt="edit-icon"]').first(),
    firstRowPrintIcon:           page.locator('table tbody tr').first().locator('img[alt="printer icon"]'),
    viewLinkNth:        (n)      => page.locator('table tbody tr').nth(n)
                                        .locator('a[href*="/delivery-allocation/"]').first(),
    rowByVehicleNo:    (vNo)     => page.locator(`table tbody tr:has-text("${vNo}")`).first(),

    // ── Pagination ────────────────────────────────────────────────────────────
    prevPageButton:              page.getByRole('button', { name: 'left' }),
    nextPageButton:              page.getByRole('button', { name: 'right' }),
    pageSizeCombobox:            page.getByRole('combobox', { name: 'Page Size' }),
});

module.exports = deliveryAllocationListLocators;
