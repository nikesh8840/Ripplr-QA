# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Run all tests (headless)
npm test

# Run all tests (headed/visible browser)
npm run test:headed

# Run a single test file (headed)
npx playwright test tests/adaptorupload/upload.spec.js --headed
npx playwright test tests/vehicle-allocation/vl1.spec.js --headed
npx playwright test tests/combined-flow.spec.js --headed

# Open HTML report after a test run
npm run test:report

# Lint
npm run lint
```

## Architecture

This is a **Playwright + JavaScript** test automation framework using the **Page Object Model (POM)** pattern for the Ripplr CDMS (Continuous Delivery Management System) web app.

### Key directories

- `tests/` — Test specs organized by feature area (adaptorupload, vehicle-allocation, segregator, return, smoke, etc.)
- `pages/` — Page Object classes. Each class wraps Playwright locators and actions for a specific UI area.
- `utils/` — Shared helpers: `uploadTestHelper.js` (upload workflow wrappers), `dataUtils.js` (CSV bill number incrementer), `loginUtils.js`, `delivery-actions.utils.js`
- `config/base.config.js` — All environment URLs and credentials (staging, preprod, IL)
- `test-data/` — CSV files for file uploads (organized as `{fc}-{brand}/`) plus JS data files for vehicle allocation and sales return

### Upload test flow (`tests/adaptorupload/upload.spec.js`)

The upload tests use helper functions from `utils/uploadTestHelper.js` which wrap the `Uploadfile` class in `pages/Aupload.page.js`. The helpers are:

| Helper | Files uploaded | Bill increment |
|--------|---------------|----------------|
| `simpleUpload` | 1 (hardcoded APX path) | No |
| `singleFileUpload` | 1 (hardcoded APX path) | No |
| `singleFileUploadWithIncrement` | 1 (dynamic via `getFilePath`) | Yes — calls `UploadSinglefileFcBrand` |
| `twoFileUploadWithIncrement` | 2 (`a` + `b`) | Yes — both files |
| `threeFileUploadWithIncrement` | 3 (`a` + `b` + `c`) | Yes — all files |
| `fcBrandUpload` | 1–3 (via `UploadSalesOrder`) | No |

**File path resolution** is handled by `getFilePath(fc, brand, fileType)` inside `Aupload.page.js`, which maps `{fc}-{brand}` → `{ a: 'file.csv', b: 'file2.csv', ... }` and resolves to `test-data/{fc}-{brand}/{filename}`.

**Bill number incrementing** (`utils/dataUtils.js` `incrementBillNumbers`) finds a specified column header in the CSV and increments the character immediately before the first digit in each row's value. The column name varies by brand (e.g. `'Bill Number'`, `'Sales Invoice No'`).

**Adding a new FC-brand upload:**
1. Add CSV files to `test-data/{fc}-{brand}/`
2. Register file mapping in `getFilePath` map in `Aupload.page.js`
3. Add FC display name to `getFCName` if not present
4. Add brand display name to `getBrandName` if not present
5. Choose the appropriate helper (`singleFileUploadWithIncrement`, `twoFileUploadWithIncrement`, etc.) and pass the correct `csvFileName` and `columnHeader` for bill incrementing

### Page method naming convention in `Aupload.page.js`

| Method | Purpose |
|--------|---------|
| `Upload` | Hardcoded APX/ERHS upload |
| `UploadSalesOrder` | 3-file dynamic FC/Brand upload |
| `UploadSalesOrdertwo` | 2-file dynamic FC/Brand upload |
| `UploadSinglefileFcBrand` | 1-file dynamic FC/Brand upload |
| `UploadSinglefile` | 1-file hardcoded ERHS/Google upload |
| `UploadSinglefileforermkSMSNG` | 1-file hardcoded ERMK/Samsung upload |

### Environment URLs (`config/base.config.js`)

| Key | Environment |
|-----|-------------|
| `baseURL` | Staging |
| `baseURL43` | Direct IP (43.205.73.33) |
| `baseURLpreprod` | Pre-production |
| `baseURLil` | IL staging |

### Playwright config highlights

- Browser: Chromium, headless, `--force-device-scale-factor=0.7`
- Timeout: 100,000ms per test
- Retries: 0
- Reports: HTML in `reports/` folder
- Screenshots/videos: retained on failure only
