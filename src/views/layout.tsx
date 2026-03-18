import type { FC, PropsWithChildren } from 'hono/jsx';
import globalCss from '../styles/global.css';
import appCss from '../styles/app.css';

interface LayoutProps {
  title?: string;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ title = 'VOZ Reader', children }) => {
  return (
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <title>{title}</title>
        <style dangerouslySetInnerHTML={{ __html: globalCss + appCss }} />
      </head>
      <body>
        <div class="nav-loading-bar" id="nav-bar"></div>
        <div class="app">
          <header class="header">
            <div class="header-inner">
              <a href="/" class="header-logo">VOZ Reader</a>
              <div class="header-right">
                <span class="header-tagline">Minimalist Forum Reader</span>
                <a href="/settings" class="header-settings" title="Cài đặt">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </a>
              </div>
            </div>
          </header>
          <main class="main">{children}</main>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          const bar = document.getElementById('nav-bar');
          document.addEventListener('click', (e) => {
            const spoilerBtn = e.target.closest('.bbCodeSpoiler-button');
            if (spoilerBtn) {
              const content = spoilerBtn.closest('.bbCodeSpoiler')?.querySelector('.bbCodeSpoiler-content');
              if (content) {
                content.style.display = content.style.display === 'none' ? '' : 'none';
              }
              return;
            }
            const link = e.target.closest('a[href]');
            if (!link) return;
            const href = link.getAttribute('href') || '';
            if (href.startsWith('#') || href.startsWith('javascript') || link.target === '_blank') return;
            bar && bar.classList.add('running');
          });
          window.addEventListener('pageshow', () => bar && bar.classList.remove('running'));
        `}} />
      </body>
    </html>
  );
};
