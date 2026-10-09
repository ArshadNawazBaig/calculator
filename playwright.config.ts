import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',fullyParallel:false,workers:1,timeout:45000,use:{baseURL:process.env.TEST_URL||'http://127.0.0.1:3000',trace:'retain-on-failure'},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],reporter:[['list'],['json',{outputFile:'test-results/browser-results.json'}]]});
