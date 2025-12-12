const AA_API_URL = (process.env.NEXT_PUBLIC_AA_API_URL || "").replace(/\/$/, "");

// Hàm hỗ trợ đọc JSON an toàn (không crash khi backend trả về rỗng)
async function safeJson(res) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!text) return {}; // body rỗng → trả object rỗng

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Lỗi parse JSON:", err);
      return {};
    }
  }

  return {}; // Không phải JSON → trả object rỗng
}

// ============================
// LOGIN API
// ============================
export const loginAPI = async (email, password) => {
  try {
    const res = await fetch(`${AA_API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Đăng nhập thất bại (HTTP ${res.status})`,
      };
    }

    return data;
  } catch (error) {
    console.error("Lỗi fetch:", error);
    return {
      success: false,
      message: "Không thể kết nối đến máy chủ.",
    };
  }
};

// ============================
// REGISTER API
// ============================
export const registerAPI = async (
  fullName,
  email,
  password,
  confirmPassword
) => {
  try {
    const res = await fetch(`${AA_API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
        confirmPassword,
      }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Đăng ký thất bại (HTTP ${res.status})`,
      };
    }

    return data;
  } catch (error) {
    console.error("Lỗi fetch register:", error);
    return {
      success: false,
      message: "Không thể kết nối đến máy chủ.",
    };
  }
};
