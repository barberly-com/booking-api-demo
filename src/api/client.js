// Thin fetch wrapper around the Barberly Booking API.
//
// Requests go straight from the browser to the API, which sends CORS headers for
// any origin. Authentication is a single X-Api-Key header — see src/config.js for
// where the key comes from and why it is safe to publish this one.

import { API_BASE_URL as BASE, API_KEY as KEY } from "../config.js";

export class ApiError extends Error {
  constructor(problem, status) {
    super(problem?.title || problem?.detail || `Request failed (${status})`);
    this.name = "ApiError";
    this.status = problem?.status ?? status;
    this.detail = problem?.detail || "";
    this.problem = problem || null;
  }
}

async function request(method, path, body) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (KEY) headers["X-Api-Key"] = KEY;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError({ title: "Network error", detail: String(cause) }, 0);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) throw new ApiError(data, res.status);
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { title: text.slice(0, 200) };
  }
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
};
