export type ThemePreference = 'system' | 'light' | 'dark';
export const themeStorageKey = 'finflo.theme.v1';
export const themeChangeEvent = 'finflo-theme-change';
export const themeColors = {light: '#ffffff', dark: '#101113'};

export function parseTheme(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
  const resolved = preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
    meta.content = themeColors[resolved];
  });
}

// Runs before page content is parsed to avoid a flash of the wrong theme. Only a validated, local preference is used.
export const themeInitScript = `(()=>{let t;try{t=localStorage.getItem(${JSON.stringify(themeStorageKey)})}catch{}if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;const dark=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.content=dark?'${themeColors.dark}':'${themeColors.light}')})()`;
