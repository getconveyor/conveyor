import React from "react";
import { Button } from "@/components/ui/button";
import { useNetwork } from "@/contexts/network-context";

export const NoInternet: React.FC = () => {
  const { retry } = useNetwork();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        color: "#fff",
        textAlign: "center",
        padding: 24,
      }}
    >
      <svg
        width="80"
        height="80"
        fill="none"
        viewBox="0 0 24 24"
        style={{ marginBottom: 24 }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#fff"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M8 16h8M9 12h6M10 8h4"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line x1="4" y1="4" x2="20" y2="20" stroke="#ff5252" strokeWidth="2" />
      </svg>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
        No Internet Connection
      </h1>
      <p style={{ fontSize: 18, marginBottom: 32 }}>
        Please check your network and try again.
      </p>
      <Button
        onClick={retry}
        size="lg"
        style={{ fontSize: 18, padding: "12px 32px" }}
      >
        Try Again
      </Button>
    </div>
  );
};
