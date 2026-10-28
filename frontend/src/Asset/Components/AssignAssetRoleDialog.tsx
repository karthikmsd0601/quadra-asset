import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Field,
  Option,
  Spinner,
  Text,
} from "@fluentui/react-components";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getUserAssignedAssetsStrict, UserAssignedAsset } from "../Services/AssetEmployeeService";
import {
  assignAssetRole,
  bulkAssignAssetRole,
  getAssetRoleTemplateDetail,
  getAssetRoleTemplates,
  AssetRoleTemplateItem,
  AssetRoleTemplateRecord,
} from "../Services/AssetRoleTemplateService";

export interface AssignRoleTarget {
  ID: string;
  DisplayName: string;
  AssetRole?: string | null;
}

interface RoleExcess {
  CategoryName: string;
  HeldCount: number;
  AllowedQuantity: number;
  ExcessCount: number;
}

// Categories where the employee already holds more assets than the chosen
// role allows. Those assets must be returned before the role can change.
const computeRoleExcess = (assets: UserAssignedAsset[], items: AssetRoleTemplateItem[]): RoleExcess[] => {
  const held = new Map<string, number>();
  assets.forEach((a) => {
    const name = (a.Category || "").trim();
    if (name) held.set(name, (held.get(name) ?? 0) + 1);
  });
  const allowed = new Map(items.map((i) => [i.CategoryName.trim().toLowerCase(), i.Quantity]));
  const excess: RoleExcess[] = [];
  held.forEach((count, name) => {
    const limit = allowed.get(name.toLowerCase()) ?? 0;
    if (count > limit) excess.push({ CategoryName: name, HeldCount: count, AllowedQuantity: limit, ExcessCount: count - limit });
  });
  return excess;
};

interface AssignAssetRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: AssignRoleTarget[];
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

const NO_ROLE = "__none__";

const AssignAssetRoleDialog: React.FC<AssignAssetRoleDialogProps> = ({ open, onOpenChange, targets, onSaved, onError }) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const [roles, setRoles] = useState<AssetRoleTemplateRecord[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(NO_ROLE);
  const [heldAssets, setHeldAssets] = useState<UserAssignedAsset[]>([]);
  const [checking, setChecking] = useState(false);
  const [excess, setExcess] = useState<RoleExcess[]>([]);
  const [saving, setSaving] = useState(false);

  const isBulk = targets.length > 1;
  const single = targets.length === 1 ? targets[0] : null;

  useEffect(() => {
    if (!open) return;
    setSelectedRoleId(single?.AssetRole || NO_ROLE);
    setExcess([]);
    setLoadingRoles(true);
    getAssetRoleTemplates()
      .then(setRoles)
      .catch((e) => onError(e instanceof Error ? e.message : "Failed to load asset roles"))
      .finally(() => setLoadingRoles(false));
    if (single) {
      getUserAssignedAssetsStrict(single.ID)
        .then(setHeldAssets)
        .catch(() => setHeldAssets([]));
    } else {
      setHeldAssets([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, single?.ID]);

  // Re-check the held-vs-allowed counts whenever the selected role changes.
  useEffect(() => {
    if (!open || !single) return;
    let cancelled = false;
    setChecking(true);
    const itemsPromise =
      selectedRoleId === NO_ROLE ? Promise.resolve<AssetRoleTemplateItem[]>([]) : getAssetRoleTemplateDetail(selectedRoleId).then((d) => d.items);
    itemsPromise
      .then((items) => {
        if (!cancelled) setExcess(computeRoleExcess(heldAssets, items));
      })
      .catch(() => {
        if (!cancelled) onError("Failed to verify currently assigned assets. Please close and retry.");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, single?.ID, selectedRoleId, heldAssets]);

  const selectedRole = useMemo(() => roles.find((r) => r.ID === selectedRoleId) ?? null, [roles, selectedRoleId]);
  const unchanged = !isBulk && (single?.AssetRole || NO_ROLE) === selectedRoleId;
  const blocked = saving || checking || excess.length > 0 || unchanged;

  const handleSave = async () => {
    if (!currentUser?.userID || targets.length === 0) return;
    const roleTemplateId = selectedRoleId === NO_ROLE ? null : selectedRoleId;
    setSaving(true);
    try {
      if (isBulk) {
        const { updatedCount } = await bulkAssignAssetRole({
          userIds: targets.map((t) => t.ID),
          roleTemplateId,
          assignedByUserId: currentUser.userID,
        });
        onSaved(
          roleTemplateId
            ? `${selectedRole?.RoleName ?? "Role"} assigned to ${updatedCount} employee${updatedCount === 1 ? "" : "s"}`
            : `Asset Role cleared for ${updatedCount} employee${updatedCount === 1 ? "" : "s"}`
        );
      } else {
        await assignAssetRole({ userId: targets[0].ID, roleTemplateId, assignedByUserId: currentUser.userID });
        onSaved(roleTemplateId ? `${selectedRole?.RoleName ?? "Role"} assigned to ${targets[0].DisplayName}` : `Asset Role cleared for ${targets[0].DisplayName}`);
      }
      onOpenChange(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unable to assign Asset Role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {portal}
      <Dialog open={open} onOpenChange={(_, d) => !saving && onOpenChange(d.open)}>
        <DialogSurface mountNode={mountNode} style={{ borderRadius: "20px", width: "500px", maxWidth: "calc(100vw - 32px)" }}>
          <DialogBody>
            <DialogTitle>Assign Asset Role</DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Text size={300} style={{ color: "#64748B" }}>
                {isBulk ? (
                  <>
                    Choose an Asset Role for <strong style={{ color: "#0F172A" }}>{targets.length} selected employees</strong>.
                  </>
                ) : (
                  <>
                    Choose an Asset Role for <strong style={{ color: "#0F172A" }}>{single?.DisplayName}</strong>.
                  </>
                )}{" "}
                Choose “No Role” to clear an existing assignment.
              </Text>

              <Field label="Asset Role">
                {loadingRoles ? (
                  <Spinner size="tiny" label="Loading asset roles..." labelPosition="after" />
                ) : (
                  <Dropdown
                    mountNode={mountNode}
                    placeholder="Select a role"
                    value={selectedRoleId === NO_ROLE ? "No Role" : selectedRole?.RoleName ?? ""}
                    selectedOptions={[selectedRoleId]}
                    onOptionSelect={(_, d) => setSelectedRoleId(d.optionValue ?? NO_ROLE)}
                  >
                    <Option value={NO_ROLE}>No Role</Option>
                    {roles.map((r) => (
                      <Option key={r.ID} value={r.ID} text={r.RoleName}>
                        {r.RoleName} ({r.CategoryCount} categor{r.CategoryCount === 1 ? "y" : "ies"})
                      </Option>
                    ))}
                  </Dropdown>
                )}
              </Field>

              {!isBulk && checking && <Spinner size="tiny" label="Checking currently assigned assets..." labelPosition="after" />}

              {!isBulk && !checking && excess.length > 0 && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                    Return these assets before {selectedRoleId === NO_ROLE ? "clearing this role" : "reassigning this role"}:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.6 }}>
                    {excess.map((e) => (
                      <li key={e.CategoryName}>
                        {e.CategoryName}: holds {e.HeldCount}, new role allows {e.AllowedQuantity} — return {e.ExcessCount}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isBulk && (
                <Text size={200} style={{ color: "#94A3B8" }}>
                  Employees holding more assets than the new role allows will show a Role Mismatch until the extra assets are returned.
                </Text>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={saving} style={{ whiteSpace: "nowrap" }}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleSave}
                disabled={blocked}
                icon={saving ? <Spinner size="tiny" /> : undefined}
                style={{ whiteSpace: "nowrap" }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default AssignAssetRoleDialog;
