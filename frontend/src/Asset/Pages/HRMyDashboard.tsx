import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Spinner } from "@fluentui/react-components";
import {
  AddRegular,
  ArrowLeftRegular,
  BuildingMultipleRegular,
  ChevronDownRegular,
  ClipboardTaskRegular,
  DismissRegular,
  PeopleTeamRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import { AssetHRRequestRecord, getAssetHRRequests, HRRequestStatus } from "../Services/AssetHRRequestService";

const statusColor: Record<HRRequestStatus, "warning" | "informative" | "success" | "danger"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
  Rejected: "danger",
  Draft: "informative",
};

const statusLabel = (status: HRRequestStatus) => (status === "InProgress" ? "In Progress" : status);

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const HRMyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AssetHRRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState<HRRequestStatus | "">("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAssetHRRequests()
      .then((data) => active && setRequests(data))
      .catch(() => active && setRequests([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.Status === "Pending").length,
      inProgress: requests.filter((r) => r.Status === "InProgress").length,
      completed: requests.filter((r) => r.Status === "Completed").length,
      rejected: requests.filter((r) => r.Status === "Rejected").length,
    }),
    [requests]
  );

  const departments = useMemo(
    () => Array.from(new Set(requests.map((r) => r.Department).filter(Boolean) as string[])).sort(),
    [requests]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (department && r.Department !== department) return false;
      if (statusFilter && r.Status !== statusFilter) return false;
      if (!term) return true;
      return [r.HRRequestID, r.RequestedUserName, r.RequestedUserMailID, r.AssignedAdminName]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [requests, search, department, statusFilter]);

  const hasFilters = !!(search || department || statusFilter);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <button
        onClick={() => navigate("/Asset/hr")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          color: "#64748B",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          width: "fit-content",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#007ED5")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
      >
        <ArrowLeftRegular style={{ fontSize: "16px" }} />
        <span>Back to HR Command Center</span>
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#0F172A" }}>
            My HR Dashboard
          </h1>
          <div style={{ fontSize: "14px", color: "#64748B", marginTop: "4px" }}>
            Track onboarding asset requisitions, who raised them, and their current progress.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/Asset/organization")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              color: "#1E293B",
              borderRadius: "9999px",
              padding: "8px 20px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            <BuildingMultipleRegular style={{ fontSize: "16px", color: "#0B8484" }} />
            <span>Organization View</span>
          </button>
          <button
            onClick={() => navigate("/Asset/organization")}
            title="Raise an onboarding requisition from the Organization View"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#007ED5",
              border: "none",
              color: "#FFFFFF",
              borderRadius: "9999px",
              padding: "9px 20px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0, 126, 213, 0.25)",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#006bb8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#007ED5")}
          >
            <AddRegular style={{ fontSize: "16px" }} />
            <span>Add New Request</span>
          </button>
        </div>
      </div>

      {/* Status cards — click to filter the table */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {(
          [
            { key: "Pending", label: "Pending", value: counts.pending, color: "#D97706" },
            { key: "InProgress", label: "In Progress", value: counts.inProgress, color: "#9333EA" },
            { key: "Completed", label: "Completed", value: counts.completed, color: "#10B981" },
            { key: "Rejected", label: "Rejected", value: counts.rejected, color: "#DC2626" },
          ] as const
        ).map((item) => {
          const active = statusFilter === item.key;
          return (
            <button
              key={item.label}
              type="button"
              aria-pressed={active}
              onClick={() => setStatusFilter(active ? "" : item.key)}
              style={{
                textAlign: "left",
                background: "#FFFFFF",
                border: `1px solid ${active ? item.color : "#E2E8F0"}`,
                boxShadow: active ? `0 0 0 1px ${item.color}` : "0 2px 8px rgba(0, 0, 0, 0.02)",
                borderRadius: "16px",
                padding: "20px 24px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>{item.value}</div>
              <div style={{ height: "4px", width: "36px", borderRadius: "9999px", background: item.color, marginTop: "12px" }} />
            </button>
          );
        })}
      </div>

      {/* Requisitions table */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "20px",
          padding: "24px 28px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#F1F5F9",
                color: "#334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              <ClipboardTaskRegular />
            </div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>HR Requisitions</h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: "1 1 320px", justifyContent: "flex-end" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "9999px",
                padding: "7px 14px",
                flex: "1 1 240px",
                maxWidth: "360px",
              }}
            >
              <SearchRegular style={{ color: "#94A3B8", fontSize: "16px", flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by request ID, requestor, or admin..."
                style={{ border: "none", outline: "none", width: "100%", fontSize: "13px", color: "#1E293B", background: "transparent" }}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  style={{ border: "none", background: "transparent", color: "#94A3B8", cursor: "pointer", padding: 0, display: "flex" }}
                >
                  <DismissRegular style={{ fontSize: "13px" }} />
                </button>
              )}
            </div>

            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    background: department ? "#EFF6FF" : "#F8FAFC",
                    border: `1px solid ${department ? "#007ED5" : "#E2E8F0"}`,
                    borderRadius: "9999px",
                    height: "34px",
                    padding: "0 14px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: department ? "#007ED5" : "#475569",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <PeopleTeamRegular style={{ fontSize: "15px" }} />
                  <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>{department || "All Departments"}</span>
                  <ChevronDownRegular style={{ fontSize: "12px", opacity: 0.7 }} />
                </button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList style={{ maxHeight: "300px", overflowY: "auto", minWidth: "220px" }}>
                  <MenuItem onClick={() => setDepartment("")}>All Departments ({requests.length})</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d} onClick={() => setDepartment(d)}>
                      {d} ({requests.filter((r) => r.Department === d).length})
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner label="Loading HR requests..." />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
            {requests.length === 0 ? "No HR requests raised yet." : "No requests found matching your search or filters."}
            {hasFilters && requests.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDepartment("");
                    setStatusFilter("");
                  }}
                  style={{
                    background: "#007ED5",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "820px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                  {["Request ID", "Raised By", "Assigned Admin(s)", "Department", "Applicants", "Status", "Created On", ""].map((h) => (
                    <th
                      key={h || "action"}
                      style={{
                        textAlign: h ? "left" : "right",
                        padding: "10px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#64748B",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((request) => {
                  const detailId = request.ID || request.HRRequestID;
                  return (
                    <tr
                      key={detailId}
                      onClick={() => navigate(`/Asset/hr-requests/${detailId}`)}
                      style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 12px", fontSize: "13.5px", fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap" }}>
                        {request.HRRequestID}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B" }}>{request.RequestedUserName || "—"}</div>
                        {request.RequestedUserMailID && (
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{request.RequestedUserMailID}</div>
                        )}
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: "13px", color: "#475569" }}>{request.AssignedAdminName || "—"}</td>
                      <td style={{ padding: "14px 12px", fontSize: "13px", color: "#475569", maxWidth: "200px" }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={request.Department || ""}>
                          {request.Department || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: "13px", color: "#475569" }}>{request.ApplicantCount}</td>
                      <td style={{ padding: "14px 12px" }}>
                        <Badge appearance="tint" color={statusColor[request.Status] || "informative"} style={{ borderRadius: "9999px" }}>
                          {statusLabel(request.Status)}
                        </Badge>
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: "12.5px", color: "#64748B", whiteSpace: "nowrap" }}>
                        {formatDate(request.CreatedAt)}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#007ED5", whiteSpace: "nowrap" }}>View Details</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRMyDashboard;
