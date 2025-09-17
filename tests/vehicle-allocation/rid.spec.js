import { test, expect } from "@playwright/test";
const path = require("path");

test("test", async ({ page }) => {
  const filePath = path.resolve(__dirname, "../../test-data/BILLS (1) (1).pdf");
  await page.goto("https://cdms-staging.ripplr.in/");
  await page.getByRole("textbox", { name: "User ID User ID" }).click();
  await page
    .getByRole("textbox", { name: "User ID User ID" })
    .fill('admin@ripplr.in');
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Password Password" }).click();
  await page
    .getByRole("textbox", { name: "Password Password" })
    .fill('M@ver!ck');
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByText("Logistics Management").click();
  await page.getByRole("link", { name: "Return To Fc" }).click();
  await page.locator("tr .ccyvke a").nth(0).click();
  await page.getByText("vehicle allocated").first().click();
  await page.getByText("Delivered", { exact: true }).click();
  await page.getByRole("button", { name: "OK" }).click();
  await page.getByRole("button", { name: "Yes" }).click();
  await page
    .getByRole("button", { name: "right Delivery Details" })
    .click();
  await page.getByRole("button", { name: "Update" }).click();
  await page.getByRole("radio", { name: "Invoice Returned" }).check();
  await page
    .getByRole("button", { name: "right Collection Details:" })
    .click();
  await page.getByRole("button", { name: "Update" }).click();
  await page.getByRole('link', {name: 'Invoice List'}).click();
  await this.page.waitForTimeout(700);
  await page.locator("td .fAmufx").nth(3).click();
  console.log("step 3 completed");
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.setInputFiles('input[type="file"]', filePath);
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.setInputFiles('input[type="file"]', filePath);
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Verify" }).click();
});
