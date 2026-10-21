import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Text, Badge, Spinner, Toast, ToastTitle, Toaster, useToastController, useId } from "@fluentui/react-components";
import { WarningRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import AssetCardGrid from "../Components/AssetCardGrid";
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              <Card style={{ padding: "40px", textAlign: "center" }}>
                <Text style={{ color: "#605E5C" }}>No assets are currently assigned to you.</Text>
              </Card>
            ) : (
              <AssetCardGrid
                assets={assets}
                onSelect={(asset) => navigate(`/Asset/my-assets/${asset.AssetID}`)}
                pendingLostAssetIds={pendingReviewAssetIds}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

export default EmployeeMyAssets;
