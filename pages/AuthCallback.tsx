import { useEffect } from "react";
import { handleAuthCallback } from "../services/stravaAuth";

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      window.location.href = "/";
      return;
    }

    handleAuthCallback(code)
      .then(() => {
        window.location.href = "/";
      })
      .catch(() => {
        alert("Authentication Failed");
        window.location.href = "/";
      });
  }, []);

  return <div>Connecting to Strava...</div>;
}