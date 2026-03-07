import { Link } from "react-router-dom";

interface Props {
  message?: string;
  onRetry?: () => void;
  isCloudflareError?: boolean;
}

export default function ErrorMessage({ message, onRetry, isCloudflareError }: Props) {
  return (
    <div className="error-message">
      <p>{message || "Đã xảy ra lỗi. Vui lòng thử lại."}</p>
      {isCloudflareError && (
        <p style={{ fontSize: 13, marginBottom: 12 }}>
          Voz.vn bị Cloudflare bảo vệ. Bạn cần{" "}
          <Link to="/settings" style={{ fontWeight: 600 }}>
            cập nhật cookie
          </Link>{" "}
          từ trình duyệt để tiếp tục đọc.
        </p>
      )}
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
