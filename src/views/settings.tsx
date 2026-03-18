import type { FC } from 'hono/jsx';
import { Layout } from './layout';

interface SettingsProps {
  hasCookies: boolean;
  cookiePreview: string;
  status?: 'ok' | 'error' | 'cleared';
  message?: string;
}

export const SettingsPage: FC<SettingsProps> = ({ hasCookies, cookiePreview, status, message }) => (
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

      {status && (
        <div class={`status-msg ${status === 'ok' || status === 'cleared' ? 'status-ok' : 'status-err'}`}>
          {message}
        </div>
      )}

      <div class="settings-section">
        <h2 class="settings-title">Cookie từ trình duyệt</h2>
        <p class="settings-desc">
          Dán cookie từ voz.vn để xem nội dung cá nhân hoá. Cookie chỉ lưu trên server, không gửi về client.
        </p>
        <form method="POST" action="/settings">
          <textarea
            name="cookies"
            class="cookie-textarea"
            placeholder="Dán cookie vào đây..."
            rows={6}
          ></textarea>
          <div class="settings-actions">
            <button type="submit" class="btn btn-primary">Lưu cookie</button>
          </div>
        </form>

        {hasCookies && (
          <form method="POST" action="/settings/clear" style="margin-top:8px">
            <button type="submit" class="btn btn-danger">Xoá cookie</button>
          </form>
        )}

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
  </Layout>
);
