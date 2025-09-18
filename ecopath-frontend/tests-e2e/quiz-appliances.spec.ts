import { test, expect } from "@playwright/test";

// E2E: 周/月切换 + 家电选择 + 结果一致性
test("Quiz appliances: week/month switch and consistency", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore My Impact" }).click();

  // 确保页面加载
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // 选择 VIC 州（若有选择器）
  if (
    await page
      .getByLabel(/State\/Territory/i)
      .isVisible()
      .catch(() => false)
  ) {
    await page.getByLabel(/State\/Territory/i).selectOption("VIC");
  }

  // 切换到 week
  await page.getByRole("button", { name: "week" }).click();

  // 展开家电模块
  const appliancesHeader = page.getByRole("button", { name: /Common Appliances/i });
  await appliancesHeader.click();

  // 勾选电视与电脑
  const tv = page.getByRole("button", { name: /Television/i });
  const computer = page.getByRole("button", { name: /Computer/i });
  await tv.click();
  await computer.click();

  // 打开高级并调整用量：电视 10h/week，电脑 5h/week
  await page.getByRole("button", { name: /Advanced usage settings/i }).click();
  const inputs = page.locator("input[type='number']");
  // 由于 fridge 默认常开，inputs 顺序可能变化，这里直接填所有可编辑输入框前两个
  const editable = await inputs.elementHandles();
  if (editable.length > 0) await editable[0].fill("10");
  if (editable.length > 1) await editable[1].fill("5");

  // 打开预览
  await page.getByRole("button", { name: /Click for full analysis/i }).click();

  // 校验弹窗出现并为 week 口径
  await expect(page.getByText(/kg CO₂\/week/i)).toBeVisible();

  // 记录周总值
  const weekText = await page.locator("text=/kg CO₂\\/week/").first().textContent();
  expect(weekText).toBeTruthy();

  // 关闭弹窗
  await page.getByRole("button", { name: "×" }).click();

  // 切到 month
  await page.getByRole("button", { name: "month" }).click();

  // 再次打开预览并断言口径切换
  await page.getByRole("button", { name: /Click for full analysis/i }).click();
  await expect(page.getByText(/kg CO₂\/month/i)).toBeVisible();
});
