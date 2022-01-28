import test, { expect } from '@playwright/test'
import { refreshUser } from '../services/browser'
import { Plan } from 'db'
import path from 'path'
import { updateUser, user } from '../services/database'

test.describe('Account page', () => {
  test('should edit user info properly', async ({ page }) => {
    await page.goto('/account')
    const saveButton = page.locator('button:has-text("Save")')
    await expect(saveButton).toBeHidden()
    await expect(
      page.locator('input[type="email"]').getAttribute('disabled')
    ).toBeDefined()
    await page.fill('#name', 'John Doe')
    expect(saveButton).toBeVisible()
    const avatarImg = page.locator('img')
    await expect(page.locator('text=JD')).toBeVisible()
    await expect(avatarImg).toBeHidden()
    await page.setInputFiles(
      'input[type="file"]',
      path.join(__dirname, '../fixtures/avatar.jpg')
    )
    await expect(avatarImg).toHaveAttribute(
      'src',
      new RegExp(
        `https://s3.eu-west-3.amazonaws.com/typebot/users/${user.id}/avatar`,
        'gm'
      )
    )
    await saveButton.click()
    await expect(saveButton).toBeHidden()
  })

  test('should display valid plans', async ({ page }) => {
    await updateUser({ plan: Plan.FREE, stripeId: null })
    await page.goto('/account')
    await expect(page.locator('text=Free plan')).toBeVisible()
    await page.evaluate(refreshUser)
    await page.reload()
    const manageSubscriptionButton = page.locator(
      'a:has-text("Manage my subscription")'
    )
    await expect(manageSubscriptionButton).toBeHidden()
    await updateUser({ plan: Plan.PRO, stripeId: 'stripeId' })
    await page.evaluate(refreshUser)
    await page.reload()
    await expect(page.locator('text=Pro plan')).toBeVisible()
    await expect(manageSubscriptionButton).toBeVisible()
  })
})