import React from "react";
import { useNavigate } from "react-router-dom";
import { AddRegular } from "@fluentui/react-icons";

interface NewAssetRequestButtonProps {
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
}

export const NewAssetRequestButton: React.FC<NewAssetRequestButtonProps> = ({
  onClick,
  style,
  className,
  id = "new-asset-request-btn",
}) => {
  const navigate = useNavigate();
  const handleClick = onClick ?? (() => navigate("/Asset/new-request"));

  return (
    <button
      id={id}
      type="button"
      onClick={handleClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        background: "#FFFFFF",
        color: "#1E293B",
        border: "1px solid #E2E8F0",
        borderRadius: "9999px",
        padding: "6px 20px 6px 8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "all 0.15s ease",
        letterSpacing: "-0.01em",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#CBD5E1";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 126, 213, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E2E8F0";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "#007ED5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <AddRegular style={{ fontSize: "16px", fontWeight: 700 }} />
      </div>
      <span>New Asset Request</span>
    </button>
  );
};

export default NewAssetRequestButton;
