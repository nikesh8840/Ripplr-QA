const { test, expect } = require('@playwright/test');
const config = require('../config/base.config');
const { Uploadfile } = require('../pages/Endtoendflow.page');

test('E2E Flow: Upload -> Allocate -> Deliver (BGRD:MRCO)', async ({ page }) => {
    
    const e2eFlow = new Uploadfile(page);
    
    await page.goto(config.baseURLpreprod);
    
    const result = await e2eFlow.runE2EFlow(
        config.credentials.username, 
        config.credentials.password, 
        config.baseURLpreprod,
        'bgrd', 
        'mrco'
    );
    
    expect(result).toBeTruthy();
});
