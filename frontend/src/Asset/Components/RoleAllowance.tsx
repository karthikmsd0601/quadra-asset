import React, { useCallback, useEffect, useState } from "react";
import { Spinner, Text } from "@fluentui/react-components";
import { ShieldPersonRegular, WarningRegular } from "@fluentui/react-icons";
import { getAssetRoleCategoryUsage, AssetRoleCategoryUsageItem } from "../Services/AssetRoleTemplateService";

export interface RoleAllowance {
  loading: boolean;
  roleName: string | null;
  items: AssetRoleCategoryUsageItem[];
  // Why an asset of this category can't be assigned right now, or null if it can.
  blockReason: (category: string | null | undefined) => string | null;
  reload: () => void;
}

// An employee's Asset Role decides which categories they may hold and how many.
// A category is assignable while allowance remains — or when a request for it
// is already pending, since assigning fulfils that request.
export const useRoleAllowance = (userId: string | null | undefined): RoleAllowance => {
  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [items, setItems] = useState<AssetRoleCategoryUsageItem[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) {
      setRoleName(null);
      setItems([]);
      return;
    }
    let active = true;
    setLoading(true);
    getAssetRoleCategoryUsage(userId)
      .then((usage) => {
        if (!active) return;
        setRoleName(usage.roleName);
        setItems(usage.items ?? []);
      })
      .catch(() => {
        if (!active) return;
        setRoleName(null);
        setItems([]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId, version]);

  const blockReason = useCallback(
    (category: string | null | undefined) => {
      if (!roleName) return "No Asset Role assigned";
      const item = items.find((i) => i.CategoryName.trim().toLowerCase() === (category || "").trim().toLowerCase());
      if (!item) return `Not included in the ${roleName} role`;
      if (item.Remaining <= 0 && item.PendingCount <= 0) return "Limit reached";
      return null;
    },
    [roleName, items]
  );

  return { loading, roleName, items, blockReason, reload: () => setVersion((v) => v + 1) };
};

interface RoleAllowanceStripProps {
  allowance: RoleAllowance;
  employeeName?: string;
  onAssignRole?: () => void;
}

// Compact summary of the role and each category's remaining allowance.
export const RoleAllowanceStrip: React.FC<RoleAllowanceStripProps> = ({ allowance, employeeName, onAssignRole }) => {
  if (allowance.loading) {
    return <Spinner size="tiny" label="Loading asset role details..." labelPosition="after" />;
  }

  if (!allowance.roleName) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "12px 14px",
          borderRadius: "12px",
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          color: "#92400E",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        <WarningRegular style={{ fontSize: "16px", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong>No Asset Role assigned.</strong> Assign an Asset Role to {employeeName || "this employee"} before adding assets.
          {onAssignRole && (
            <>
              {" "}
              <button
                type="button"
                onClick={onAssignRole}
                style={{ border: "none", background: "transparent", color: "#007ED5", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "inherit" }}
              >
                Assign now
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Text size={200} style={{ color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <ShieldPersonRegular style={{ fontSize: "14px", color: "#6D28D9" }} />
        Asset Role: <strong style={{ color: "#0F172A" }}>{allowance.roleName}</strong>
      </Text>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {allowance.items.map((item) => {
          const full = item.Remaining <= 0 && item.PendingCount <= 0;
          return (
            <span
              key={item.CategoryID || item.CategoryName}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 600,
                background: full ? "#FEF2F2" : "#F0FDF4",
                color: full ? "#B91C1C" : "#15803D",
                border: `1px solid ${full ? "#FECACA" : "#BBF7D0"}`,
              }}
            >
              {item.CategoryName}
              <span style={{ fontWeight: 500 }}>
                · {full ? "Limit reached" : `${item.Remaining} of ${item.RoleQuantity} remaining`}
              </span>
              {item.PendingCount > 0 && <span style={{ color: "#B45309", fontWeight: 500 }}>· Pending request exists</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
};
