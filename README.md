# QA Automation Framework
# 🧪 QA Automation Framework – Playwright + JavaScript

This is an industry-grade QA Automation Framework built using [Playwright](https://playwright.dev/) with JavaScript. Designed for scalability, clarity, and CI/CD readiness.

---

## 🚀 Features

- Page Object Model (POM) design
- Environment config via `.env`
- CI integration with GitHub Actions
- HTML reports and test data fixtures
- Screenshots + video on failures
- Modular test folder structure
- Linting & clean code practices

---

## 📁 Folder Structure

| Folder / File        | Purpose |
|----------------------|---------|
| `tests/`             | Test specs organized by feature |
| `pages/`             | Page Object Models (POM) |
| `utils/`             | Helpers like logger, data utils |
| `test-data/`         | Static test data in JSON |
| `config/`            | Different configs for envs |
| `reports/`           | Auto-generated test reports |
| `.github/workflows/` | GitHub CI/CD workflows |

---

## 🔧 Setup Instructions

```bash
# Clone the repo
git clone https://github.com/bipinyct-infinite-locus/qa-automation-playwright.git
cd qa-automation-playwright

# Install dependencies
npm install

# Run tests
npm test

# Show HTML Report
npm run test:report

# npx playwright test tests/vehicle-allocation/dl.spec.js --headed       
# npx playwright test tests/adaptorupload/upload.spec.js --headed  
# npx playwright test tests/vehicle-allocation/dl-rfclose.spec.js --headed                 
