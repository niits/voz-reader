import { useState } from "react";

interface Props {
  hasCookies: boolean;
  cookiePreview: string;
}

export default function SettingsForm({ hasCookies: initialHas, cookiePreview }: Props) {
  const [cookieInput, setCookieInput] = useState("");
  const [hasCookies, setHasCookies] = useState(initialHas);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!cookieInput.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookies: cookieInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "ok", text: "Đã lưu cookie thành công! Quay lại trang chủ để thử." });
        setHasCookies(true);
        setCookieInput("");
      } else {
        setMessage({ type: "err", text: data.message || "Không thể lưu cookie." });
      }
    } catch {
      setMessage({ type: "err", text: "Lỗi kết nối." });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await fetch("/api/cookies", { method: "DELETE" });
    setHasCookies(false);
    setMessage({ type: "ok", text: "Đã xoá cookie." });
  };

  return (
    <div className="settings-content">
      {/* Status */}
      <div className="settings-section">
        <h2 className="settings-section-title">Trạng thái kết nối</h2>
        <div className={`connection-status ${hasCookies ? "connected" : "disconnected"}`}>
          <span className="status-dot" />
          <span>
            {hasCookies
              ? "Đã có cookie — sẵn sàng đọc Voz"
              : "Chưa có cookie — cần thiết lập để bypass Cloudflare"}
          </span>
        </div>
        {hasCookies && cookiePreview && (
          <div className="cookie-preview">
            <code>{cookiePreview}</code>
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
            Cookie được lưu dưới dạng HTTP cookie (HttpOnly) và gửi kèm mỗi request.
            Khi cookie hết hạn (~2 giờ), cần cập nhật lại.
          </p>
        </div>

        <textarea
          className="cookie-textarea"
          placeholder={"Paste cookie string từ browser vào đây...\nVí dụ: cf_clearance=abc123; xf_session=xyz789; ..."}
          value={cookieInput}
          onChange={(e) => setCookieInput(e.target.value)}
          rows={4}
        />

        <div className="settings-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!cookieInput.trim() || loading}
          >
            {loading ? "Đang kiểm tra..." : "Lưu Cookie"}
          </button>
          {hasCookies && (
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
  );
}
