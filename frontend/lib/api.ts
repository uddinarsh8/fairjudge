const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function apiRequest(
  endpoint: string,
  options: RequestOptions = {}
) {
  const {
    method = "GET",
    body,
    token,
  } = options;

  // =====================================================
  // GET TOKEN
  // =====================================================

  let authToken = token;

  if (!authToken && typeof window !== "undefined") {
    authToken =
      localStorage.getItem("fairjudge_token") ||
      localStorage.getItem("token") ||
      undefined;
  }

  // =====================================================
  // HEADERS
  // =====================================================

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // =====================================================
  // URL
  // =====================================================

  const requestUrl = `${API_URL}${endpoint}`;

  console.log("=================================");
  console.log("API REQUEST");
  console.log("URL:", requestUrl);
  console.log("Method:", method);
  console.log(
    "Authorization:",
    authToken ? "Token attached" : "NO TOKEN"
  );
  console.log("=================================");

  // =====================================================
  // FETCH
  // =====================================================

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      method,
      headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch (error) {
    console.error(
      "API connection failed:",
      error
    );

    throw new Error(
      "Unable to connect to the backend server. Make sure the FairJudge backend is running on http://localhost:5000."
    );
  }

  // =====================================================
  // RESPONSE TYPE
  // =====================================================

  const contentType =
    response.headers.get("content-type") || "";

  // =====================================================
  // NON-JSON RESPONSE
  // =====================================================

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    console.error(
      "================================="
    );
    console.error(
      "NON-JSON RESPONSE"
    );
    console.error("URL:", requestUrl);
    console.error("Status:", response.status);
    console.error("Response:", text);
    console.error(
      "================================="
    );

    throw new Error(
      `API returned a non-JSON response. Status: ${response.status}. URL: ${requestUrl}`
    );
  }

  // =====================================================
  // JSON RESPONSE
  // =====================================================

  const data = await response.json();

  console.log(
    "API RESPONSE:",
    response.status,
    data
  );

  // =====================================================
  // AUTHENTICATION ERROR
  // =====================================================

  if (response.status === 401) {
    const message =
      data.message ||
      data.error ||
      "Authentication required";

    console.error(
      "Authentication failed:",
      message
    );

    // ---------------------------------------------------
    // Token expired / invalid
    // ---------------------------------------------------

    if (typeof window !== "undefined") {
      localStorage.removeItem("fairjudge_token");
      localStorage.removeItem("token");

      // Prevent redirect loop if already on login page
      if (
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.href = "/login";
      }
    }

    throw new Error(message);
  }

  // =====================================================
  // OTHER ERROR RESPONSES
  // =====================================================

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Something went wrong"
    );
  }

  // =====================================================
  // SUCCESS
  // =====================================================

  return data;
}