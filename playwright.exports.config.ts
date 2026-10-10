import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',testMatch:'mobile-exports.spec.ts',workers:1,timeout:90_000,
  use:{baseURL:process.env.TEST_URL||'http://127.0.0.1:3000',trace:'retain-on-failure'},
  projects:[
    {name:'android-chromium',use:{...devices['Pixel 7'],browserName:'chromium'}},
    {name:'iphone-webkit',use:{...devices['iPhone 13'],browserName:'webkit'}},
  ],
  reporter:[['list'],['json',{outputFile:'test-results/mobile-export-results.json'}]],
});
