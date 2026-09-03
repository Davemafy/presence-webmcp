import {test,expect} from '@playwright/test'

test('normal phone route remains a full editor',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('/?demo=1')
 await page.getByRole('tab',{name:'Mobile'}).click()
 await page.getByText('Your product team, finally in the same orbit.').click()
 await expect(page.locator('.human-inspector')).toBeVisible()
 await expect(page.getByText(/YOU · HEADLINE/)).toBeVisible()
})

test('authority remote controls the same desktop session locally',async({context})=>{
 const desktop=await context.newPage();await desktop.goto('/?demo=1')
 await desktop.getByRole('button',{name:/Preview admission flow/i}).click()
 await desktop.getByRole('button',{name:'Phone authority'}).click()
 const code=(await desktop.locator('.pair-meta b').textContent())!.trim().toLowerCase()
 const remote=await context.newPage();await remote.goto(`/remote/${code}`)
 await expect(remote.getByText('Wants Tablet access.')).toBeVisible()
 await remote.getByRole('button',{name:'Admit'}).click()
 await expect(desktop.getByText('YOUR AGENT',{exact:true})).toBeVisible()
 await remote.getByRole('button',{name:'Revoke'}).click()
 await expect(desktop.getByText(/Seat is empty again/)).toBeVisible()
 await remote.getByRole('button',{name:/Prove next mutation is blocked/}).click()
 await expect(remote.getByText('ADMISSION_REVOKED')).toBeVisible()
})

test('deep-linked authority route boots through the SPA router',async({page})=>{
 await page.goto('/remote/ABCDEF1234')
 await expect(page.getByText('Authority remote')).toBeVisible()
 await expect(page.getByText('ABCDEF1234')).toBeVisible()
})

test('phone can enter authority mode without scanning its own QR',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('/?demo=1')
 await page.getByRole('button',{name:'Phone authority'}).click()
 await expect(page.getByRole('button',{name:/Use this device as authority/i})).toBeVisible()
 await expect(page.locator('.qr-wrap')).toBeHidden()
 await page.getByRole('button',{name:/Use this device as authority/i}).click()
 await expect(page).toHaveURL(/\/remote\/[a-z0-9]+$/)
 await expect(page.getByText('Authority remote')).toBeVisible()
})
