import { test, expect, type Page } from "@playwright/test";

const NOMINATIM_MOCK = [
  {
    lat: "37.7749",
    lon: "-122.4194",
    address: { state: "California", country_code: "us" },
  },
];

async function fillAddressOverlay(
  page: Page,
  dialogName: string,
  primaryLabel: string,
) {
  const overlay = page.getByRole("dialog", { name: dialogName });
  await overlay.waitFor();
  await overlay.locator("#start-loc-line1").fill("100 Market St");
  await overlay.locator("#start-loc-city").fill("San Francisco");
  await overlay.locator("#start-loc-state").selectOption("California");
  await overlay.locator("#start-loc-zip").fill("94105");
  await overlay.locator("#start-loc-country").selectOption("United States");
  await overlay.getByRole("button", { name: primaryLabel }).click();
}

async function addDeliveryAddress(page: Page, recipientName: string) {
  await page.getByRole("button", { name: "Add address" }).click();
  await page
    .locator('[aria-label="Recipient name"]')
    .first()
    .fill(recipientName);
  await page.locator('[aria-label="Edit recipient address"]').first().click();
  await fillAddressOverlay(page, "Enter Address", "Confirm");
  await page.locator('[aria-label="Confirm row"]').first().click();
}

test("optimize flow routes 2 stops to 1 vehicle", async ({ page }) => {
  test.setTimeout(180_000);

  await page.route(/nominatim\.openstreetmap\.org\/search/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(NOMINATIM_MOCK),
    }),
  );

  // Landing → Welcome → Edit
  await page.goto("/");
  await page.getByRole("button", { name: "Route manager — continue" }).click();
  await page.waitForURL("**/welcome");
  await page.getByRole("button", { name: "New user — continue" }).click();
  await page.waitForURL("**/edit");

  // Add one vehicle via overlay
  await page.getByRole("button", { name: "Add vehicle" }).click();
  const vehicleDialog = page.getByRole("dialog", {
    name: "Add vehicle details",
  });
  await vehicleDialog.waitFor();
  await vehicleDialog.locator("#overlay-vehicle-name").fill("E2E Van");
  await vehicleDialog.locator("#overlay-vehicle-type").selectOption("truck");
  await vehicleDialog.locator("#overlay-vehicle-capacity").fill("100");
  await vehicleDialog.locator("#overlay-vehicle-unit").selectOption("units");
  await vehicleDialog.locator('[aria-label="Departure hours"]').fill("08");
  await vehicleDialog.locator('[aria-label="Departure minutes"]').fill("00");
  await vehicleDialog.getByRole("button", { name: "Confirm" }).click();

  // Add two delivery addresses
  await addDeliveryAddress(page, "Stop One");
  await addDeliveryAddress(page, "Stop Two");

  // Optimize button is in ManageSectionHeader inside <main>, not the navbar
  await page
    .getByRole("main")
    .getByRole("button", { name: "Optimize" })
    .click();

  // Fill depot address overlay (appears because no start location is set)
  await fillAddressOverlay(
    page,
    "Enter starting location for all driver routes",
    "Optimize",
  );

  // Assert optimization succeeded by confirming route data in the sidebar
  await page.waitForURL("**/results", { timeout: 120_000 });
  await expect(
    page.getByRole("heading", { name: "Optimized Routes" }),
  ).toBeVisible();
  await expect(page.getByText("1 route with 2 total stops")).toBeVisible();
});
