import {readFile} from 'node:fs/promises';
import {request as requestFactory, type BrowserContext, type TestInfo} from '@playwright/test';

type DisposableBlogState = {
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  SUPER_ADMIN_NAME: string;
  BETTER_AUTH_URL: string;
  FINFLO_DISPOSABLE_DATABASE: string;
};

/** Fixture writes require an explicitly marked, local-only application. */
export async function disposableBlogState(testInfo: TestInfo) {
  let state: DisposableBlogState;
  try {
    state = JSON.parse(await readFile(process.env.FINFLO_BLOG_TEST_STATE || '/tmp/finflo-editor-test-state.json', 'utf8'));
  } catch {
    throw new Error('Provide an isolated local blog test state through FINFLO_BLOG_TEST_STATE.');
  }
  const baseURL = String(testInfo.project.use.baseURL || process.env.TEST_URL || state.BETTER_AUTH_URL || '');
  const url = new URL(baseURL);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.origin !== new URL(state.BETTER_AUTH_URL).origin || state.FINFLO_DISPOSABLE_DATABASE !== '1') {
    throw new Error('Editorial fixtures require the explicitly marked disposable database on its configured loopback origin.');
  }
  if (!state.SUPER_ADMIN_EMAIL || !state.SUPER_ADMIN_PASSWORD || !state.SUPER_ADMIN_NAME) {
    throw new Error('The disposable blog test account is incomplete.');
  }
  return {baseURL: url.origin, authorName: state.SUPER_ADMIN_NAME, email: state.SUPER_ADMIN_EMAIL, password: state.SUPER_ADMIN_PASSWORD};
}

/** The password stays in a separate untraced API context, never a page field. */
export async function signInDisposableBlog(context: BrowserContext, state: Awaited<ReturnType<typeof disposableBlogState>>) {
  const request = await requestFactory.newContext({baseURL: state.baseURL});
  try {
    let signedIn = false;
    try {
      const response = await request.post('/api/auth/sign-in/email', {
        headers: {Origin: state.baseURL},
        data: {email: state.email, password: state.password, rememberMe: false},
      });
      signedIn = response.status() === 200;
    } catch {
      throw new Error('The isolated blog sign-in endpoint was unreachable.');
    }
    if (!signedIn) throw new Error('The isolated blog test account could not sign in.');
    await context.addCookies((await request.storageState()).cookies);
  } finally {
    await request.dispose();
  }
}
