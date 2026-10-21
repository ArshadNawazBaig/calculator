import {isPublishedLocale} from '../../src/lib/i18n/config';
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';

// These controls depend on touch capabilities, even under the default desktop project.
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

test('CSV downloads contain the full schedule and the retry link stays usable',async({page})=>{
  await page.goto('/loan-calculator');
  await expect(page.getByRole('button',{name:'CSV',exact:true})).toBeEnabled();
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'CSV',exact:true}).click();
  const download=await pending;
  expect(download.suggestedFilename()).toBe('finflo-loan-calculator.csv');
  const text=await readFile((await download.path())!,'utf8');
  const rowCount=await page.locator('#calculation-table tbody tr').count();
  expect(text.split('\r\n')).toHaveLength(rowCount+2);
  const link=page.getByRole('link',{name:'Download file',exact:true});
  await expect(link).toBeVisible();
  const liveBlob=await link.evaluate(async(element:HTMLAnchorElement)=>(await fetch(element.href)).text());
  expect(liveBlob).toBe(text.replace(/^\uFEFF/,''));
  const retry=page.waitForEvent('download');
  await link.click();
  expect(await readFile((await (await retry).path())!,'utf8')).toBe(text);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('PDF creates a valid multipage file on a phone without calling window.print',async({page},info)=>{
  await page.addInitScript(()=>{window.print=()=>{throw new Error('Native printing unavailable');};});
  await page.goto('/loan-calculator');
  await page.locator('#loan-years').fill('30');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('#calculation-table tbody tr')).toHaveCount(360);
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'PDF',exact:true}).click();
  const download=await pending;
  expect(download.suggestedFilename()).toBe('finflo-loan-calculator.pdf');
  const bytes=await readFile((await download.path())!);
  expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  const pdf=await PDFDocument.load(bytes);
  expect(pdf.getTitle()).toBe('Loan Calculator');
  expect(pdf.getPageCount()).toBeGreaterThan(8);
  await download.saveAs(info.outputPath('loan.pdf'));
  await expect(page.getByRole('link',{name:'Download file',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'PDF',exact:true})).toBeEnabled();
});

test('native file sharing is invoked from a fresh tap and cancellation keeps the download available',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'canShare',{value:(data:ShareData)=>Boolean(data.files?.length)});
    Object.defineProperty(navigator,'share',{value:async(data:ShareData)=>{
      document.body.dataset.sharedFile=data.files?.[0]?.name;
      document.body.dataset.sharedType=data.files?.[0]?.type;
      document.body.dataset.shareActivated=String(navigator.userActivation.isActive);
      throw new DOMException('Cancelled','AbortError');
    }});
  });
  await page.goto('/grade-calculator');
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'PDF',exact:true}).click();
  await pending;
  await page.getByRole('button',{name:'Save or share',exact:true}).click();
  await expect(page.locator('body')).toHaveAttribute('data-shared-file','finflo-grade-calculator.pdf');
  await expect(page.locator('body')).toHaveAttribute('data-shared-type','application/pdf');
  await expect(page.locator('body')).toHaveAttribute('data-share-activated','true');
  await expect(page.getByText('Sharing is unavailable. Use Download file instead.')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Download file',exact:true})).toBeVisible();
});

test('a browser that blocks file sharing still offers a working download',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'canShare',{value:()=>true});
    Object.defineProperty(navigator,'share',{value:()=>Promise.reject(new DOMException('Blocked','NotAllowedError'))});
  });
  await page.goto('/grade-calculator');
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'CSV',exact:true}).click();
  await pending;
  await page.getByRole('button',{name:'Save or share',exact:true}).click();
  await expect(page.getByText('Sharing is unavailable. Use Download file instead.')).toBeVisible();
  const retry=page.waitForEvent('download');
  await page.getByRole('link',{name:'Download file',exact:true}).click();
  expect((await retry).suggestedFilename()).toBe('finflo-grade-calculator.csv');
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.getByRole('link',{name:'Download file',exact:true})).toHaveCount(0);
});

test('the visible save link works when automatic downloads are blocked',async({page})=>{
  await page.addInitScript(()=>{
    const click=HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click=function(){if(!this.hidden)click.call(this);};
  });
  await page.goto('/grade-calculator');
  for(const format of ['CSV','PDF']) {
    await page.getByRole('button',{name:format,exact:true}).click();
    const link=page.getByRole('link',{name:'Download file',exact:true});
    await expect(link).toHaveAttribute('download',`finflo-grade-calculator.${format.toLowerCase()}`);
    const pending=page.waitForEvent('download');
    await link.click();
    expect((await pending).suggestedFilename()).toBe(`finflo-grade-calculator.${format.toLowerCase()}`);
  }
});

test('PDF creation failures show a retryable message',async({page})=>{
  await page.addInitScript(()=>{
    const toBlob=HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob=function(callback){
      HTMLCanvasElement.prototype.toBlob=toBlob;
      callback(null);
    };
  });
  await page.goto('/grade-calculator');
  await page.getByRole('button',{name:'PDF',exact:true}).click();
  await expect(page.getByText('The file could not be created. Please try again.')).toBeVisible();
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'PDF',exact:true}).click();
  expect((await pending).suggestedFilename()).toBe('finflo-grade-calculator.pdf');
});

for(const [locale,downloadText,title] of [['hi','फ़ाइल डाउनलोड करें','ग्रेड कैलकुलेटर'],['ar','تنزيل الملف','الدرجات الدراسية']] as const) {
  test(`${locale} PDF renders localized text and a mobile save link`,async({page},info)=>{
    test.skip(!isPublishedLocale(locale), 'This translation is not published.');
    await page.goto(`/${locale}/grade-calculator`);
    const pending=page.waitForEvent('download');
    await page.getByRole('button',{name:'PDF',exact:true}).click();
    const download=await pending;
    const pdf=await PDFDocument.load(await readFile((await download.path())!));
    expect(pdf.getTitle()).toBe(title);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    await download.saveAs(info.outputPath(`${locale}.pdf`));
    await expect(page.getByRole('link',{name:downloadText,exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
