const THEME_FONT_SCRIPT = `
(() => {
  try {
    const savedFont = window.localStorage.getItem('theme-font');
    if (savedFont) {
      document.documentElement.style.setProperty('--font-primary', savedFont);
    }
  } catch {}
})();
`;

export function ThemeFontScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_FONT_SCRIPT }} />;
}
