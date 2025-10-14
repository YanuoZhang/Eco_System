import type { Page, APIRequestContext } from "@playwright/test";

export async function loginViaApi(request: APIRequestContext, page: Page, password?: string) {
  // Use API to login and get cookie with retry logic for transient network errors
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await request.post("/api/site-auth/login", {
        data: { password: password || process.env.SITE_PASSWORD || "Ecopath@123" },
        timeout: 10000, // 10 second timeout
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

      // Success - exit retry loop
      return;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Login attempt ${attempt}/${maxRetries} failed: ${errorMessage}`);

      // Only retry on network errors (ECONNRESET, timeout, etc)
      if (
        attempt < maxRetries &&
        (errorMessage.includes("ECONNRESET") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("network"))
      ) {
        // Wait before retrying (exponential backoff)
        const delay = 1000 * attempt;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Don't retry for other errors (e.g., authentication failures)
        break;
      }
    }
  }

  // All retries failed
  throw lastError || new Error("Login failed after retries");
}
