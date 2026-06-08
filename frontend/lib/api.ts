// STRYK Frontend - API Utility
// Handles fetching from the Python FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  // Extract token from Clerk if available (requires passing token from client components)
  // For server components, you can pass headers or auth token
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "API Error";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // Ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
