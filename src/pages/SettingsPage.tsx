import { useState } from "react";
import { Link } from "react-router-dom";
import { saveCookies, getCookieStatus, clearCookies } from "../services/api";

export default function SettingsPage() {
  const [cookieInput, setCookieInput] = useState("");
  const [status, setStatus] = useState(() => getCookieStatus());
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSave = () => {
    if (!cookieInput.trim()) return;
    setMessage(null);
    try {
      saveCookies(cookieInput.trim());
      setMessage({ type: "ok", text: "Đã lưu cookie thành công! Quay lại trang chủ để thử." });
      setCookieInput("");
      setStatus(getCookieStatus());
    } catch {
      setMessage({ type: "err", text: "Không thể lưu cookie." });
    }
  };

  const handleClear = () => {
    clearCookies();
    setStatus(getCookieStatus());
    setMessage({ type: "ok", text: "Đã xoá cookie." });
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <Link to="/" className="breadcrumb">
          ← Trang chủ
        </Link>
        <h1 className="page-title">Cài đặt</h1>
      </div>

      <div className="settings-content">
        {/* Status */}
        <div className="settings-section">
          <h2 className="settings-section-title">Trạng thái kết nối</h2>
          <div className={`connection-status ${status.hasCookies ? "connected" : "disconnected"}`}>
            <span className="status-dot" />
            <span>
              {status.hasCookies
                ? "Đã có cookie — sẵn sàng đọc Voz"
                : "Chưa có cookie — cần thiết lập để bypass Cloudflare"}
            </span>
          </div>
          {status.hasCookies && status.preview && (
            <div className="cookie-preview">
              <code>{status.preview}</code>
            </div>
          )}
        </div>

        {/* Cookie input */}
        <div className="settings-section">
          <h2 className="settings-section-title">Nhập Cookie</h2>
          <div className="settings-help">
            <p><strong>Voz.vn được bảo vệ bởi Cloudflare.</strong> Để đọc được, bạn cần paste cookie từ browser:</p>
            <ol>
              <li>Mở <a href="https://voz.vn" target="_blank" rel="noopener noreferrer">voz.vn</a> trong trình duyệt và đăng nhập</li>
              <li>Nhấn <kbd>F12</kbd> → tab <strong>Network</strong></li>
              <li>Refresh trang, click request đầu tiên (voz.vn)</li>
              <li>Tìm mục <strong>Request Headers</strong> → <strong>Cookie</strong></li>
              <li>Copy toàn bộ giá trị và paste vào ô bên dưới</li>
            </ol>
            <p className="settings-note">
              Cookie cần chứa <code>cf_clearance</code> và <code>xf_session</code>.
              Cookie được lưu trong localStorage của trình duyệt và gửi kèm mỗi request đến server proxy.
              Khi cookie hết hạn (~15-30 phút), cần cập nhật lại.
            </p>
          </div>

          <textarea
            className="cookie-textarea"
            placeholder="Paste cookie string từ browser vào đây...&#10;Ví dụ: cf_clearance=abc123; xf_session=xyz789; ..."
            value={cookieInput}
            onChange={(e) => setCookieInput(e.target.value)}
            rows={4}
          />

          <div className="settings-actions">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!cookieInput.trim()}
            >
              Lưu Cookie
            </button>
            {status.hasCookies && (
              <button className="btn btn-danger" onClick={handleClear}>
                Xoá Cookie
              </button>
            )}
          </div>

          {message && (
            <div className={`settings-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
