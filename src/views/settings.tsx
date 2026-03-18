import type { FC } from 'hono/jsx';
import { Layout } from './layout';

interface SettingsProps {
  hasCookies: boolean;
  cookiePreview: string;
}

export const SettingsPage: FC<SettingsProps> = ({ hasCookies, cookiePreview }) => (
  <Layout title="Cài đặt — VOZ Reader">
    <div class="settings-page">
      <div class="page-header">
        <a href="/" class="breadcrumb">← Trang chủ</a>
        <h1 class="page-title">Cài đặt</h1>
      </div>

      <div class="settings-section">
        <div class={`cookie-status ${hasCookies ? 'connected' : 'disconnected'}`}>
          {hasCookies ? '✓ Đã kết nối' : '✗ Chưa có cookie'}
        </div>
        {hasCookies && cookiePreview && (
          <p class="cookie-preview">{cookiePreview}</p>
        )}
      </div>

      <div class="settings-section">
        <h2 class="settings-title">Cookie từ trình duyệt</h2>
        <p class="settings-desc">
          Dán cookie từ voz.vn để xem nội dung cá nhân hoá. Cookie chỉ lưu trên server, không gửi về client.
        </p>
        <div id="status-msg" class="status-msg" style="display:none"></div>
        <textarea
          id="cookie-input"
          class="cookie-textarea"
          placeholder="Dán cookie vào đây..."
          rows={6}
        ></textarea>
        <div class="settings-actions">
          <button id="save-btn" class="btn btn-primary" type="button">Lưu cookie</button>
          {hasCookies && (
            <button id="clear-btn" class="btn btn-danger" type="button">Xoá cookie</button>
          )}
        </div>
        <details class="settings-help">
          <summary>Cách lấy cookie</summary>
          <ol>
            <li>Đăng nhập voz.vn trên trình duyệt</li>
            <li>Mở DevTools (F12) → Application → Cookies → voz.vn</li>
            <li>Copy toàn bộ cookie string</li>
            <li>Dán vào ô trên và nhấn Lưu</li>
          </ol>
        </details>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: `
      const saveBtn = document.getElementById('save-btn');
      const clearBtn = document.getElementById('clear-btn');
      const input = document.getElementById('cookie-input');
      const status = document.getElementById('status-msg');

      function showStatus(msg, ok) {
        status.textContent = msg;
        status.className = 'status-msg ' + (ok ? 'status-ok' : 'status-err');
        status.style.display = 'block';
      }

      if (saveBtn) saveBtn.addEventListener('click', async () => {
        const cookies = input.value.trim();
        if (!cookies) { showStatus('Cookie trống.', false); return; }
        saveBtn.disabled = true;
        try {
          const res = await fetch('/api/cookies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookies }),
          });
          const data = await res.json();
          showStatus(data.message, data.ok);
          if (data.ok) setTimeout(() => location.reload(), 800);
        } catch (e) {
          showStatus('Lỗi kết nối.', false);
        } finally {
          saveBtn.disabled = false;
        }
      });

      if (clearBtn) clearBtn.addEventListener('click', async () => {
        clearBtn.disabled = true;
        try {
          await fetch('/api/cookies', { method: 'DELETE' });
          location.reload();
        } finally {
          clearBtn.disabled = false;
        }
      });
    `}} />
  </Layout>
);
