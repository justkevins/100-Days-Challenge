import { STRAVA_CLIENT_ID, STRAVA_REDIRECT_URI } from "../constants";
import { StravaTokenResponse } from "../types";

const STORAGE_KEY_TOKEN = "strava_access_token";
const STORAGE_KEY_REFRESH = "strava_refresh_token";
const STORAGE_KEY_EXPIRES = "strava_expires_at";
const STORAGE_KEY_USER = "strava_user_profile";

export const initiateStravaAuth = () => {
  if (!STRAVA_CLIENT_ID) {
    alert("Please set STRAVA_CLIENT_ID in constants.ts");
    return;
  }

  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all", // Request access to activities
  });

  window.location.href = `https://www.strava.com/oauth/authorize?${params.toString()}`;
};

export const handleAuthCallback = async (code: string) => {
  const response = await fetch("/api/auth/exchange", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange token");
  }

  const data = await response.json();

  localStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
  localStorage.setItem(STORAGE_KEY_REFRESH, data.refresh_token);
  localStorage.setItem(STORAGE_KEY_EXPIRES, data.expires_at.toString());
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.athlete));

  return data.athlete;
};

export const getLoggedInUser = () => {
  const userStr = localStorage.getItem(STORAGE_KEY_USER);
  return userStr ? JSON.parse(userStr) : null;
};

export const isLoggedIn = () => {
  return !!localStorage.getItem(STORAGE_KEY_TOKEN);
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_REFRESH);
  localStorage.removeItem(STORAGE_KEY_EXPIRES);
  localStorage.removeItem(STORAGE_KEY_USER);
  window.location.reload();
};
