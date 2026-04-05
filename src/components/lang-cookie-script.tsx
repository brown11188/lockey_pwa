/**
 * Inline script that reads the locale cookie and sets <html lang> before first paint.
 * This prevents the default lang="vi" from flashing when the user prefers English.
 * Must be rendered inside <head> or at the top of <body>.
 *
 * This is a Server Component (no "use client" directive) so it can be used
 * directly in layout.tsx without being bundled into client JS.
 */
export function LangCookieScript() {
  const scriptContent = `(function(){try{var m=document.cookie.match(/(?:^|; )lockey-locale=([^;]*)/);var l=m&&m[1];if(l==="vi"||l==="en")document.documentElement.lang=l;}catch(e){}})();`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}