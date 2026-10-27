import { expect, test } from "@playwright/test";

for (const path of ["/", "/tickets/not-a-real-ticket"]) {
  test(`requires sign-in at ${path}, including after refresh`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(
      page.getByRole("heading", { name: "Your support workspace" }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Customer tickets", exact: true }),
    ).toHaveCount(0);

    await expect(
      page.getByRole("heading", { name: "Ticket details", exact: true }),
    ).toHaveCount(0);

    await page.reload();

    await expect(
      page.getByRole("heading", { name: "Your support workspace" }),
    ).toBeVisible();

    await expect(page).toHaveURL(
      new URL(path, "http://localhost:4173").toString(),
    );
  });
}
