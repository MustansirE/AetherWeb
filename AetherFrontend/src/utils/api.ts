const API_URL = "http://127.0.0.1:8000";

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  let token = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  // Ensure headers always exist
  options.headers = {
    ...(options.headers || {}),  // Merge existing headers or create an empty object
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let response = await fetch(`${API_URL}${url}`, options);

  if (response.status === 401 && refreshToken) {
    console.log("Token expired. Refreshing...");

    // Try refreshing the token
    const refreshResponse = await fetch(`${API_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      localStorage.setItem("access_token", refreshData.access);
      token = refreshData.access;

      // Retry the original request with the new token
      options.headers = {
        ...options.headers, 
        Authorization: `Bearer ${token}`,
      };
      response = await fetch(`${API_URL}${url}`, options);
    } else {
      console.error("Session expired. Please log in again.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      alert("Session expired. Please log in again.");
      return;
    }
  }

  return response.json();
};
