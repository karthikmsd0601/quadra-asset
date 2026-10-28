import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Text, Badge, Spinner, Toast, ToastTitle, Toaster, useToastController, useId } from "@fluentui/react-components";
import { ArrowSwapRegular, BoxRegular, WarningRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import AssetCardGrid from "../Components/AssetCardGrid";
import ReportLostAssetPanel from "../Components/ReportLostAssetPanel";
import { getUserAssignedAssets, UserAssignedAsset } from "../Services/AssetEmployeeService";
import { getPendingLostItemsForUser, PendingLostItemRecord } from "../Services/AssetLostRequestService";
import NewAssetRequestButton from "../Components/NewAssetRequestButton";

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN");

const EmployeeMyAssets: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toasterId = useId("employee-my-assets-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [assets, setAssets] = useState<UserAssignedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLostItems, setPendingLostItems] = useState<PendingLostItemRecord[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [reportLostOpen, setReportLostOpen] = useState(false);

  const loadData = async () => {
    if (!currentUser?.userID) return;
    setLoading(true);
    try {
      const [data, pendingLost] = await Promise.all([
        getUserAssignedAssets(currentUser.userID),
        getPendingLostItemsForUser(currentUser.userID),
      ]);
      setAssets(data);
      setPendingLostItems(pendingLost);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load your assets"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  const pendingReviewAssetIds = new Set(
    pendingLostItems.filter((i) => i.ItemStatus === "Pending" || i.ItemStatus === "PendingManagerApproval").map((i) => i.AssetID)
  );
  const awaitingReplacementItems = pendingLostItems.filter((i) => i.ItemStatus === "AwaitingReplacement");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userID]);

  const toggleAssetSelect = (asset: UserAssignedAsset) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(asset.AssetID)) next.delete(asset.AssetID);
      else next.add(asset.AssetID);
      return next;
    });
  };

  const selectedAssetsForReport = assets.filter((a) => selectedAssetIds.has(a.AssetID));

  return (
    <>
      <Toaster toasterId={toasterId} />
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <Text size={600} weight="semibold" style={{ fontSize: "24px", lineHeight: "32px" }}>
            My Assets
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/Asset/my-assets/handover")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                color: "#1E293B",
                border: "1px solid #E2E8F0",
                borderRadius: "9999px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                transition: "all 0.15s ease",
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
              <ArrowSwapRegular style={{ fontSize: "16px", color: "#007ED5" }} />
              <span>Request Handover</span>
            </button>
            <NewAssetRequestButton />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner label="Loading your assets..." />
          </div>
        ) : (
          <>
            {awaitingReplacementItems.length > 0 && (
              <Card style={{ padding: "16px", border: "1px solid #F2C811", borderRadius: "10px", background: "#FFFBF0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <WarningRegular style={{ color: "#B8860B" }} />
                  <Text weight="semibold">Waiting for a Replacement</Text>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {awaitingReplacementItems.map((item) => (
                    <div key={item.ItemID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text size={200}>
                        {item.Category ?? "Asset"} — lost on {formatDate(item.LostDate)}
                      </Text>
                      <Badge appearance="tint" color="warning">
                        Replacement Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {assets.length === 0 ? (
              <Card style={{ padding: "48px 20px", textAlign: "center", borderRadius: "16px" }}>
                <BoxRegular style={{ fontSize: "40px", color: "#94A3B8", margin: "0 auto 12px", display: "block" }} />
                <Text weight="semibold" style={{ display: "block", color: "#334155", fontSize: "15px" }}>
                  No assets are currently assigned to you
                </Text>
                <Text style={{ display: "block", color: "#64748B", fontSize: "13px", marginTop: "6px" }}>
                  Raise a new asset request to have equipment assigned.
                </Text>
              </Card>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <Text size={200} style={{ color: "#64748B" }}>
                    Select an asset to report it lost:
                  </Text>
                  <button
                    type="button"
                    disabled={selectedAssetIds.size === 0}
                    onClick={() => setReportLostOpen(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: selectedAssetIds.size > 0 ? "#EF4444" : "#F1F5F9",
                      color: selectedAssetIds.size > 0 ? "#FFFFFF" : "#94A3B8",
                      border: "none",
                      borderRadius: "9999px",
                      padding: "7px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: selectedAssetIds.size > 0 ? "pointer" : "not-allowed",
                      boxShadow: selectedAssetIds.size > 0 ? "0 2px 6px rgba(239, 68, 68, 0.25)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <WarningRegular style={{ fontSize: "14px" }} />
                    <span>Report Lost{selectedAssetIds.size > 0 ? ` (${selectedAssetIds.size})` : ""}</span>
                  </button>
                </div>
                <AssetCardGrid
                  assets={assets}
                  onSelect={(asset) => navigate(`/Asset/my-assets/${asset.AssetID}`)}
                  selectable
                  selectedIds={selectedAssetIds}
                  onToggleSelect={toggleAssetSelect}
                  pendingLostAssetIds={pendingReviewAssetIds}
                />
              </>
            )}
          </>
        )}
      </div>

      {currentUser?.userID && (
        <ReportLostAssetPanel
          open={reportLostOpen}
          onOpenChange={setReportLostOpen}
          employeeUserId={currentUser.userID}
          employeeName={currentUser.displayName ?? "You"}
          reportedByUserId={currentUser.userID}
          reportedByRole="Employee"
          assets={selectedAssetsForReport}
          onCreated={() => {
            setSelectedAssetIds(new Set());
            loadData();
          }}
        />
      )}
    </>
  );
};

export default EmployeeMyAssets;
