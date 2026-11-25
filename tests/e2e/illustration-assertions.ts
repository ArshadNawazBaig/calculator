import {expect, type Locator} from '@playwright/test';

/** A locator screenshot can otherwise change input styles anywhere on the page. */
export function captureIllustration(target: Locator, path?: string) {
  return target.screenshot({caret: 'initial', animations: 'disabled', path});
}

/** Check the actual rendered asset, including native lazy loading without page scripts. */
export async function expectLoadedIllustrations(images: Locator) {
  for (const image of await images.all()) {
    await expect(image).toHaveJSProperty('tagName', 'IMG');
    await expect(image).toHaveAttribute('src', /^\/illustrations\/(?:area|solid|planar|material)\/.+\.webp$/);
    const alt = await image.getAttribute('alt');
    expect(alt).not.toBeNull();
    await expect(image).toHaveAccessibleName(alt!);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true);
  }
}
