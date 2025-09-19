import type { Page, APIRequestContext } from "@playwright/test";

export async function loginViaApi(request: APIRequestContext, page: Page, password?: string) {
  // Use API to login and get cookie
  const response = await request.post("/api/site-auth/login", {
    data: { password: password || process.env.SITE_PASSWORD || "Ecopath@123" },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  // Extract cookie from response headers
  const setCookieHeader = response.headers()["set-cookie"];
  if (setCookieHeader) {
    const cookieValue = setCookieHeader.split(";")[0].split("=")[1];

    // Set cookie in browser context
    await page.context().addCookies([
      {
        name: "site_auth",
        value: cookieValue,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
      },
    ]);
  }
}
