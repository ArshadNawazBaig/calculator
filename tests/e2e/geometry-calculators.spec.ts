import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mathSearchContent} from '../../src/data/math-search-content';
import {expectLoadedIllustrations} from './illustration-assertions';

for (const [slug, unit, result] of [
  ['volume-calculator', 'Cubic feet', '1 ft³'],
  ['surface-area-calculator', 'Square feet', '7 ft²'],
] as const) {
  test(`${slug} supports illustrated selection, mixed units and reference links on mobile`, async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(`/${slug}`);
    const shapes = page.getByRole('group', {name: 'Choose a shape'});
    await expect(shapes.getByRole('button')).toHaveCount(12);
    await expect(shapes.locator('img[alt=""]')).toHaveCount(12);
    await expect(shapes.getByRole('img')).toHaveCount(0);
    await expectLoadedIllustrations(shapes.locator('img'));
    await shapes.getByRole('button', {name: 'Rectangular prism', exact: true}).click();
    await expect(page.locator('#calculator-inputs').getByRole('img')).toHaveAttribute('alt', /Rectangular prism with length a, width b/);
    await expectLoadedIllustrations(page.locator('#calculator-inputs').getByRole('img'));
    for (const [key, value, label] of [['a', '2', 'Feet'], ['b', '12', 'Inches'], ['h', '6', 'Inches']]) {
      await page.locator(`#cuboid-${key}`).fill(value);
      await page.locator(`#cuboid-${key}Unit`).click();
      await page.getByRole('option', {name: label, exact: true}).click();
    }
    await page.locator('#cuboid-outputUnit').click();
    await page.getByRole('option', {name: unit, exact: true}).click();
    await page.getByRole('button', {name: 'Calculate', exact: true}).click();
    await expect(page.locator('.primary-metric dd')).toHaveText(result);
    await shapes.getByRole('button', {name: 'Rectangular prism', exact: true}).click();
    await expect(page.locator('#cuboid-b')).toHaveValue('12');
    await page.locator('#method-tube a').click();
    await expect(shapes.getByRole('button', {name: 'Hollow cylinder', exact: true})).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#tube-r2').fill('6');
    await page.getByRole('button', {name: 'Calculate', exact: true}).click();
    await expect(page.locator('#calculator-inputs').getByRole('alert')).toContainText('Inner radius');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect((await new AxeBuilder({page}).include('.calculator-workspace').analyze()).violations).toEqual([]);
  });
}

test('circle changes its diagram and field label to the known measurement', async ({page}) => {
  await page.goto('/circle-calculator');
  await page.locator('#circle-known').click();
  await page.getByRole('option', {name: 'diameter', exact: true}).click();
  await expect(page.locator('#calculator-inputs').getByRole('img')).toHaveAttribute('alt', /diameter d crossing the center/);
  await expectLoadedIllustrations(page.locator('#calculator-inputs').getByRole('img'));
  await page.getByRole('spinbutton', {name: /^Diameter/}).fill('10');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('78.54');
  await page.locator('#circle-known').click();
  await page.getByRole('option', {name: 'area', exact: true}).click();
  await expect(page.locator('#calculator-inputs').getByRole('img')).toHaveAttribute('alt', /interior marked A/);
  await expectLoadedIllustrations(page.locator('#calculator-inputs').getByRole('img'));
  await expect(page.getByRole('spinbutton', {name: /^Area/})).toBeVisible();
  await expect(page.locator('#calculator-inputs')).toContainText('square units');
});

test('triangle method buttons preserve angle conventions and radians', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto('/triangle-calculator');
  const methods = page.getByRole('group', {name: 'Choose known measurements'});
  await methods.getByRole('button', {name: 'Two sides & included angle', exact: true}).click();
  await expect(page.locator('#calculator-inputs').getByRole('img')).toHaveAttribute('alt', /included angle C/);
  await expectLoadedIllustrations(page.locator('#calculator-inputs').getByRole('img'));
  await page.locator('#sas-a').fill('3');
  await page.locator('#sas-b').fill('4');
  await page.locator('#sas-angleUnit').click();
  await page.getByRole('option', {name: 'Radians', exact: true}).click();
  await page.locator('#sas-angle').fill('pi/2');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('6 square units');
  await page.reload();
  await expect(methods.getByRole('button', {name: 'Two sides & included angle', exact: true})).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('Pythagorean and right-triangle guides stay consistent with their selected inputs', async ({page}) => {
  await page.goto('/pythagorean-theorem-calculator');
  await page.getByRole('button', {name: 'Find a leg', exact: true}).click();
  await page.locator('#leg-c').fill('13');
  await page.locator('#leg-a').fill('5');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('12');
  await page.goto('/right-triangle-calculator#mode-pair');
  await page.locator('#pair-pair').click();
  await page.getByRole('option', {name: 'Leg a + Angle A', exact: true}).click();
  await page.locator('#pair-angleUnit').click();
  await page.getByRole('option', {name: 'Radians', exact: true}).click();
  await page.locator('#pair-first').fill('3');
  await page.locator('#pair-second').fill('pi/6');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.result-metrics .metric').filter({has: page.getByText('Area', {exact: true})}).locator('dd')).toContainText('7.79');
  await expect(page.locator('#calculator-inputs')).toContainText('radians');
});

test('solid references and all measurement guides are readable without JavaScript', async ({browser, baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL});
  try {
    const page = await context.newPage();
    for (const slug of ['volume-calculator', 'surface-area-calculator', 'circle-calculator', 'triangle-calculator', 'right-triangle-calculator', 'pythagorean-theorem-calculator']) {
      await page.goto(`/${slug}`);
      const measurement = page.locator('#calculator-inputs').getByRole('img');
      await expect(measurement).toHaveCount(1);
      await expectLoadedIllustrations(measurement);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org/${slug}`);
      if (slug === 'volume-calculator' || slug === 'surface-area-calculator') {
        await expect(page.locator('#formula-reference tbody a[href^="#mode-"]')).toHaveCount(12);
        const illustrations = page.locator('#formula-reference').getByRole('img');
        await expect(illustrations).toHaveCount(12);
        await expectLoadedIllustrations(illustrations);
        await expect(page.locator('#method-cap-inverse')).toHaveCount(1);
        await expect(page.locator('#common-questions details')).toHaveCount(6);
        const updated = mathSearchContent[slug]!.modifiedAt;
        await expect(page.locator(`time[datetime="${updated}"]`)).toBeVisible();
        if (slug === 'volume-calculator') {
          await expect(page.locator('[data-calculator-visual] figcaption')).toContainText('Rectangular prism');
          for (const [section, description] of [
            ['#volume-capacity', /water depth of 35 cm holds 175 L/],
            ['#tapered-planter', /30 cm across at the soil line/],
            ['#composite-volume', /inside diameter is 4 cm/],
          ] as const) {
            const diagram = page.locator(section).getByRole('img', {name: description});
            await expect(diagram).toHaveCount(1);
            await expectLoadedIllustrations(diagram);
          }
          const planter = page.locator('#tapered-planter');
          await expect(planter.locator('ol li')).toHaveCount(3);
          await expect(planter.getByRole('link')).toHaveAttribute('href', '#mode-frustum');
        }
        await expect(page.locator('body')).not.toContainText('Use consistent length units. Dimensions must be positive.');
      }
    }
  } finally {
    await context.close();
  }
});
