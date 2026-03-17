import { useState, useEffect, useCallback, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface RegistryEntry {
  id?: string | number;
  slug?: string;
  name?: string;
  title?: string;
  description?: string;
  summary?: string;
  category?: string;
  type?: string;
  version?: string;
  author?: string;
  url?: string;
  homepage?: string;
  link?: string;
  created_at?: string;
  _source?: "featured" | "entry";
  [key: string]: unknown;
}

interface EndpointStatus {
  path: string;
  desc: string;
  ok: boolean | null;
}

// ── API ──────────────────────────────────────────────────────────────────────
async function apiFetch(
  path: string,
  apiKey: string,
  params: Record<string, string> = {}
): Promise<RegistryEntry[]> {
  const url = new URL("/api/registry" + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  if (Array.isArray(json)) return json;
  return (json.data || json.results || json.items || json.entries || []) as RegistryEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
const esc = (s: unknown) => String(s ?? "");
const truncate = (s: string | undefined, n: number) =>
  s && s.length > n ? s.slice(0, n) + "…" : s;

// ── CSS-in-JS tokens ──────────────────────────────────────────────────────────
const S = {
  layout: { display: "flex", height: "100vh", overflow: "hidden" } as React.CSSProperties,

  sidebar: {
    width: 220,
    background: "var(--bp-bg2)",
    borderRight: "1px solid var(--bp-border)",
    display: "flex",
    flexDirection: "column" as const,
    flexShrink: 0,
    overflow: "hidden",
  } as React.CSSProperties,
  sidebarInner: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    padding: "0 0 16px",
  } as React.CSSProperties,
  logo: {
    padding: "20px 18px 16px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    borderBottom: "1px solid var(--bp-border)",
  } as React.CSSProperties,
  logoPulse: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--bp-accent)",
    boxShadow: "0 0 8px var(--bp-accent)",
    flexShrink: 0,
  } as React.CSSProperties,
  logoText: {
    fontFamily: "var(--bp-mono)",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--bp-text)",
    letterSpacing: "-0.01em",
  } as React.CSSProperties,
  nav: { flex: 1, overflowY: "auto" as const, padding: "8px 0" } as React.CSSProperties,
  navGroup: {
    padding: "14px 18px 4px",
    fontSize: 9,
    fontFamily: "var(--bp-mono)",
    color: "var(--bp-text3)",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,
  navItem: (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "7px 18px",
    cursor: "pointer",
    color: active ? "var(--bp-accent)" : "var(--bp-text2)",
    background: active ? "var(--bp-accent-bg)" : "transparent",
    borderLeft: `2px solid ${active ? "var(--bp-accent)" : "transparent"}`,
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    transition: "all 0.12s",
    userSelect: "none",
  }),
  navBadge: {
    marginLeft: "auto",
    fontSize: 10,
    fontFamily: "var(--bp-mono)",
    background: "var(--bp-bg3)",
    border: "1px solid var(--bp-border)",
    borderRadius: 99,
    padding: "1px 7px",
    color: "var(--bp-text3)",
  } as React.CSSProperties,
  sidebarFooter: {
    padding: "12px 18px 0",
    borderTop: "1px solid var(--bp-border)",
  } as React.CSSProperties,
  apiKeyBtn: {
    width: "100%",
    background: "transparent",
    border: "1px solid var(--bp-border2)",
    borderRadius: 8,
    padding: "7px 12px",
    color: "var(--bp-text2)",
    fontSize: 12,
    fontFamily: "var(--bp-mono)",
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "all 0.12s",
  } as React.CSSProperties,

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  } as React.CSSProperties,
  topbar: {
    padding: "14px 24px",
    borderBottom: "1px solid var(--bp-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "var(--bp-bg)",
    flexShrink: 0,
  } as React.CSSProperties,
  topTitle: { fontSize: 15, fontWeight: 600, color: "var(--bp-text)" } as React.CSSProperties,
  topSub: { fontSize: 11, color: "var(--bp-text3)", marginTop: 1 } as React.CSSProperties,
  content: { flex: 1, overflowY: "auto" as const, padding: "22px 24px" } as React.CSSProperties,

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 10,
    marginBottom: 22,
  } as React.CSSProperties,
  stat: {
    background: "var(--bp-bg2)",
    border: "1px solid var(--bp-border)",
    borderRadius: 12,
    padding: "14px 16px",
  } as React.CSSProperties,
  statLabel: {
    fontSize: 10,
    fontFamily: "var(--bp-mono)",
    color: "var(--bp-text3)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    marginBottom: 6,
  } as React.CSSProperties,
  statVal: {
    fontSize: 24,
    fontWeight: 600,
    color: "var(--bp-text)",
    letterSpacing: "-0.03em",
    fontFamily: "var(--bp-mono)",
  } as React.CSSProperties,

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
    gap: 10,
  } as React.CSSProperties,
  card: (hover: boolean): React.CSSProperties => ({
    background: "var(--bp-bg2)",
    border: `1px solid ${hover ? "var(--bp-border2)" : "var(--bp-border)"}`,
    borderRadius: 12,
    padding: "16px 18px",
    cursor: "pointer",
    transition: "border-color 0.15s, transform 0.15s",
    transform: hover ? "translateY(-1px)" : "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  }),
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  } as React.CSSProperties,
  cardName: { fontSize: 13, fontWeight: 500, color: "var(--bp-text)", lineHeight: 1.4 } as React.CSSProperties,
  cardDesc: { fontSize: 12, color: "var(--bp-text2)", lineHeight: 1.55 } as React.CSSProperties,
  cardMeta: { display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 2 } as React.CSSProperties,

  badge: (type: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      featured: { bg: "var(--bp-accent-bg)", color: "var(--bp-accent)", border: "var(--bp-accent-b)" },
      entry: { bg: "var(--bp-bg3)", color: "var(--bp-text3)", border: "var(--bp-border)" },
      warn: { bg: "var(--bp-warn-bg)", color: "var(--bp-warn)", border: "rgba(240,167,66,0.25)" },
      danger: { bg: "var(--bp-danger-bg)", color: "var(--bp-danger)", border: "rgba(240,92,92,0.2)" },
    };
    const t = map[type] || map.entry;
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 10,
      fontFamily: "var(--bp-mono)",
      padding: "2px 8px",
      borderRadius: 99,
      background: t.bg,
      color: t.color,
      border: `1px solid ${t.border}`,
      whiteSpace: "nowrap",
    };
  },
  tag: {
    fontSize: 10,
    fontFamily: "var(--bp-mono)",
    color: "var(--bp-text3)",
    background: "var(--bp-bg3)",
    border: "1px solid var(--bp-border)",
    borderRadius: 5,
    padding: "2px 7px",
  } as React.CSSProperties,

  searchWrap: {
    display: "flex",
    gap: 10,
    marginBottom: 18,
    alignItems: "center",
  } as React.CSSProperties,
  input: {
    flex: 1,
    background: "var(--bp-bg3)",
    border: "1px solid var(--bp-border)",
    borderRadius: 8,
    padding: "8px 13px",
    color: "var(--bp-text)",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  } as React.CSSProperties,
  select: {
    background: "var(--bp-bg3)",
    border: "1px solid var(--bp-border)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "var(--bp-text2)",
    fontSize: 12,
    fontFamily: "var(--bp-mono)",
    outline: "none",
    cursor: "pointer",
  } as React.CSSProperties,
  btn: (v: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      accent: { bg: "var(--bp-accent)", color: "#000", border: "var(--bp-accent)" },
      ghost: { bg: "transparent", color: "var(--bp-text2)", border: "var(--bp-border2)" },
      danger: { bg: "transparent", color: "var(--bp-danger)", border: "rgba(240,92,92,0.3)" },
    };
    const t = map[v] || map.ghost;
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 14px",
      borderRadius: 8,
      border: `1px solid ${t.border}`,
      background: t.bg,
      color: t.color,
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      fontFamily: "var(--bp-mono)",
      transition: "opacity 0.12s, background 0.12s",
    };
  },

  panel: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    width: 420,
    height: "100vh",
    background: "var(--bp-bg2)",
    borderLeft: "1px solid var(--bp-border2)",
    display: "flex",
    flexDirection: "column" as const,
    zIndex: 50,
    animation: "bp-fadeIn 0.2s ease",
  } as React.CSSProperties,
  panelHead: {
    padding: "18px 22px",
    borderBottom: "1px solid var(--bp-border)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  } as React.CSSProperties,
  panelBody: { flex: 1, overflowY: "auto" as const, padding: "20px 22px" } as React.CSSProperties,
  fieldRow: { marginBottom: 18 } as React.CSSProperties,
  fieldLabel: {
    fontSize: 10,
    fontFamily: "var(--bp-mono)",
    color: "var(--bp-text3)",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: 5,
  } as React.CSSProperties,
  fieldVal: { fontSize: 13, color: "var(--bp-text)", wordBreak: "break-all" as const } as React.CSSProperties,
  codeBox: {
    background: "var(--bp-bg3)",
    border: "1px solid var(--bp-border)",
    borderRadius: 8,
    padding: "14px 16px",
    fontFamily: "var(--bp-mono)",
    fontSize: 11,
    color: "var(--bp-text2)",
    overflowX: "auto" as const,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
    lineHeight: 1.7,
  } as React.CSSProperties,

  modal: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  } as React.CSSProperties,
  modalBox: {
    background: "var(--bp-bg2)",
    border: "1px solid var(--bp-border2)",
    borderRadius: 12,
    padding: "28px 28px 24px",
    width: 420,
    animation: "bp-fadeIn 0.2s ease",
  } as React.CSSProperties,
  modalTitle: { fontSize: 15, fontWeight: 600, marginBottom: 6 } as React.CSSProperties,
  modalSub: {
    fontSize: 12,
    color: "var(--bp-text2)",
    marginBottom: 20,
    lineHeight: 1.6,
  } as React.CSSProperties,

  divider: { borderTop: "1px solid var(--bp-border)", margin: "18px 0" } as React.CSSProperties,
  empty: {
    textAlign: "center" as const,
    padding: "56px 24px",
    color: "var(--bp-text3)",
    fontFamily: "var(--bp-mono)",
    fontSize: 12,
  } as React.CSSProperties,
  errorBox: {
    background: "var(--bp-danger-bg)",
    border: "1px solid rgba(240,92,92,0.2)",
    borderRadius: 8,
    padding: "11px 14px",
    color: "var(--bp-danger)",
    fontSize: 12,
    fontFamily: "var(--bp-mono)",
    marginBottom: 18,
    lineHeight: 1.6,
  } as React.CSSProperties,
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid var(--bp-border2)",
    borderTop: "2px solid var(--bp-accent)",
    borderRadius: "50%",
    animation: "bp-spin 0.7s linear infinite",
    flexShrink: 0,
  } as React.CSSProperties,
};

// ── Icon ──────────────────────────────────────────────────────────────────────
function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    settings:
      "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    x: "M18 6L6 18M6 6l12 12",
    copy: "M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-2 M16 4h2a2 2 0 012 2v8 M9 9h8",
    refresh:
      "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
    exlink: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(paths[name] || "").split(" M").map((d, i) => (
        <path key={i} d={i === 0 ? d : "M" + d} />
      ))}
    </svg>
  );
}

const Spin = () => <div style={S.spinner} />;

// ── API Key Modal ─────────────────────────────────────────────────────────────
function ApiKeyModal({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (k: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(current || "");
  return (
    <div style={S.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={S.modalTitle}>API Key</div>
        <div style={S.modalSub}>
          Your key is stored in memory only — it is never persisted.
          <br />
          It will be sent as{" "}
          <code style={{ fontFamily: "var(--bp-mono)", color: "var(--bp-accent)" }}>
            Authorization: Bearer &lt;key&gt;
          </code>{" "}
          on every request.
        </div>
        <input
          style={{ ...S.input, marginBottom: 14, width: "100%" }}
          type="password"
          placeholder="sk-…"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave(val)}
          autoFocus
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button style={S.btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          {current && (
            <button
              style={S.btn("danger")}
              onClick={() => {
                onSave("");
                onClose();
              }}
            >
              Remove key
            </button>
          )}
          <button
            style={S.btn("accent")}
            onClick={() => {
              onSave(val);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ item, onClose }: { item: RegistryEntry; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copyId = () => {
    const id = item.id || item.slug || item.name;
    navigator.clipboard?.writeText(String(id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const fields = Object.entries(item).filter(
    ([k]) => !k.startsWith("_") && k !== "description" && k !== "summary"
  );
  const desc = item.description || item.summary;
  const name = item.name || item.title || item.slug || "(unnamed)";
  const url = item.url || item.homepage || item.link;
  return (
    <div style={S.panel}>
      <div style={S.panelHead}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontSize: 14, fontWeight: 600, color: "var(--bp-text)", marginBottom: 6, wordBreak: "break-word" }}
          >
            {name}
          </div>
          <span style={S.badge(item._source === "featured" ? "featured" : "entry")}>
            {item._source === "featured" ? "★ featured" : "entry"}
          </span>
        </div>
        <button style={{ ...S.btn("ghost"), padding: "6px 8px" }} onClick={onClose}>
          <Icon name="x" size={13} />
        </button>
      </div>
      <div style={S.panelBody}>
        {desc && (
          <div style={S.fieldRow}>
            <div style={S.fieldLabel}>Description</div>
            <div style={S.fieldVal}>{esc(desc)}</div>
          </div>
        )}
        {url && (
          <div style={S.fieldRow}>
            <div style={S.fieldLabel}>Link</div>
            <a
              href={url as string}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--bp-accent)", fontSize: 12, fontFamily: "var(--bp-mono)", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}
            >
              {truncate(url as string, 48)} <Icon name="exlink" size={11} />
            </a>
          </div>
        )}
        <div style={S.divider} />
        <div style={S.fieldLabel}>Raw fields</div>
        <div style={{ ...S.codeBox, marginTop: 8 }}>
          {fields.map(([k, v]) => (
            <div key={k} style={{ marginBottom: 4 }}>
              <span style={{ color: "var(--bp-text3)" }}>{k}: </span>
              <span style={{ color: "var(--bp-text)" }}>
                {typeof v === "object" ? JSON.stringify(v) : esc(v)}
              </span>
            </div>
          ))}
        </div>
        <div style={S.divider} />
        <button style={{ ...S.btn("ghost"), fontSize: 11 }} onClick={copyId}>
          <Icon name="copy" size={11} /> {copied ? "copied!" : "copy id"}
        </button>
      </div>
    </div>
  );
}

// ── Entry Card ────────────────────────────────────────────────────────────────
function EntryCard({ item, onClick }: { item: RegistryEntry; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const name = item.name || item.title || item.slug || "(unnamed)";
  const desc = item.description || item.summary;
  const isFeatured = item._source === "featured";
  const tags = [item.category, item.type, item.version ? `v${item.version}` : null].filter(Boolean) as string[];
  return (
    <div
      style={S.card(hover)}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={S.cardTop}>
        <div style={S.cardName}>{name}</div>
        <span style={S.badge(isFeatured ? "featured" : "entry")}>{isFeatured ? "★" : "·"}</span>
      </div>
      {desc && <div style={S.cardDesc}>{truncate(desc as string, 100)}</div>}
      {tags.length > 0 && (
        <div style={S.cardMeta}>
          {tags.map((t) => (
            <span key={t} style={S.tag}>
              {t}
            </span>
          ))}
          {item.author && (
            <span style={{ ...S.tag, color: "var(--bp-text2)" }}>by {item.author as string}</span>
          )}
        </div>
      )}
      {item.created_at && (
        <div style={{ fontSize: 10, fontFamily: "var(--bp-mono)", color: "var(--bp-text3)" }}>
          {fmtDate(item.created_at)}
        </div>
      )}
    </div>
  );
}

// ── Sub-pages ─────────────────────────────────────────────────────────────────
function OverviewPage({
  data,
  counts,
  loading,
  error,
  apiKey,
}: {
  data: RegistryEntry[];
  counts: Record<string, number>;
  loading: boolean;
  error: string | null;
  apiKey: string;
}) {
  const featured = data.filter((d) => d._source === "featured");
  const recent = [...data]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6);
  return (
    <>
      {error && <div style={S.errorBox}>⚠ {error}</div>}
      <div style={S.statGrid}>
        {[
          { label: "total entries", val: counts.entries ?? data.length },
          { label: "featured", val: counts.featured ?? featured.length },
          { label: "loaded", val: data.length },
          { label: "api key", val: apiKey ? "set" : "none" },
        ].map((s) => (
          <div key={s.label} style={S.stat}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={S.statVal}>{loading ? "…" : s.val}</div>
          </div>
        ))}
      </div>
      {featured.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontFamily: "var(--bp-mono)", color: "var(--bp-text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Featured
          </div>
          <div style={{ ...S.cardGrid, marginBottom: 26 }}>
            {featured.slice(0, 3).map((item, i) => (
              <EntryCard key={i} item={item} onClick={() => {}} />
            ))}
          </div>
        </>
      )}
      {recent.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontFamily: "var(--bp-mono)", color: "var(--bp-text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Recent entries
          </div>
          <div style={S.cardGrid}>
            {recent.map((item, i) => (
              <EntryCard key={i} item={item} onClick={() => {}} />
            ))}
          </div>
        </>
      )}
      {!loading && data.length === 0 && (
        <div style={S.empty}>
          No data loaded yet.
          <br />
          Check your API key or click refresh.
        </div>
      )}
    </>
  );
}

function EntriesPage({
  data,
  loading,
  error,
}: {
  data: RegistryEntry[];
  loading: boolean;
  error?: string;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("default");
  const [selected, setSelected] = useState<RegistryEntry | null>(null);
  const filtered = useMemo(() => {
    let items = data.filter((d) => d._source === "entry" || !d._source);
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter((d) => {
        const name = ((d.name || d.title || d.slug || "") as string).toLowerCase();
        const desc = ((d.description || d.summary || "") as string).toLowerCase();
        const cat = ((d.category || "") as string).toLowerCase();
        return name.includes(lq) || desc.includes(lq) || cat.includes(lq);
      });
    }
    if (sort === "name")
      items = [...items].sort((a, b) => ((a.name || "") as string).localeCompare((b.name || "") as string));
    if (sort === "date")
      items = [...items].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    return items;
  }, [data, q, sort]);

  return (
    <>
      {error && <div style={S.errorBox}>⚠ {error}</div>}
      <div style={S.searchWrap}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--bp-text3)", pointerEvents: "none" }}>
            <Icon name="search" size={13} />
          </span>
          <input
            style={{ ...S.input, paddingLeft: 32 }}
            placeholder="Search entries…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select style={S.select} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Default</option>
          <option value="name">Name</option>
          <option value="date">Date</option>
        </select>
        <div style={{ fontSize: 11, fontFamily: "var(--bp-mono)", color: "var(--bp-text3)" }}>
          {filtered.length} items
        </div>
      </div>
      {loading ? (
        <div style={S.empty}>
          <Spin />
        </div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>No entries found.</div>
      ) : (
        <div style={S.cardGrid}>
          {filtered.map((item, i) => (
            <EntryCard key={i} item={item} onClick={() => setSelected(item)} />
          ))}
        </div>
      )}
      {selected && <DetailPanel item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function FeaturedPage({
  data,
  loading,
  error,
}: {
  data: RegistryEntry[];
  loading: boolean;
  error?: string;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<RegistryEntry | null>(null);
  const featured = useMemo(() => {
    let items = data.filter((d) => d._source === "featured");
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter((d) => {
        const name = ((d.name || d.title || d.slug || "") as string).toLowerCase();
        const desc = ((d.description || d.summary || "") as string).toLowerCase();
        return name.includes(lq) || desc.includes(lq);
      });
    }
    return items;
  }, [data, q]);

  return (
    <>
      {error && <div style={S.errorBox}>⚠ {error}</div>}
      <div style={S.searchWrap}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--bp-text3)", pointerEvents: "none" }}>
            <Icon name="search" size={13} />
          </span>
          <input
            style={{ ...S.input, paddingLeft: 32 }}
            placeholder="Search featured…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ fontSize: 11, fontFamily: "var(--bp-mono)", color: "var(--bp-text3)" }}>
          {featured.length} items
        </div>
      </div>
      {loading ? (
        <div style={S.empty}>
          <Spin />
        </div>
      ) : featured.length === 0 ? (
        <div style={S.empty}>No featured entries.</div>
      ) : (
        <div style={S.cardGrid}>
          {featured.map((item, i) => (
            <EntryCard key={i} item={item} onClick={() => setSelected(item)} />
          ))}
        </div>
      )}
      {selected && <DetailPanel item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function SettingsPage({
  apiKey,
  onSaveKey,
  endpoints,
  onRefresh,
  loading,
  lastFetch,
}: {
  apiKey: string;
  onSaveKey: (k: string) => void;
  endpoints: EndpointStatus[];
  onRefresh: () => void;
  loading: boolean;
  lastFetch: string | null;
}) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div style={{ maxWidth: 560 }}>
        <div style={S.stat}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="shield" size={14} />
            <span style={{ fontWeight: 500 }}>Authentication</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--bp-text2)", marginBottom: 14, lineHeight: 1.7 }}>
            API key is held in memory only — never written to disk or localStorage. Sent as{" "}
            <code style={{ fontFamily: "var(--bp-mono)", color: "var(--bp-accent)" }}>
              Authorization: Bearer
            </code>
            .
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={S.badge(apiKey ? "featured" : "entry")}>
              {apiKey ? "● key set" : "○ no key"}
            </span>
            <button style={S.btn("ghost")} onClick={() => setShowModal(true)}>
              <Icon name="key" size={11} /> {apiKey ? "Change key" : "Set API key"}
            </button>
            {apiKey && (
              <button style={S.btn("danger")} onClick={() => onSaveKey("")}>
                <Icon name="x" size={11} /> Remove
              </button>
            )}
          </div>
        </div>
        <div style={S.divider} />
        <div style={{ fontSize: 11, fontFamily: "var(--bp-mono)", color: "var(--bp-text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Endpoints
        </div>
        {endpoints.map((ep) => (
          <div key={ep.path} style={{ ...S.stat, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <code style={{ fontFamily: "var(--bp-mono)", fontSize: 12, color: "var(--bp-accent)" }}>
                GET {ep.path}
              </code>
              <span style={S.badge(ep.ok ? "featured" : ep.ok === false ? "danger" : "entry")}>
                {ep.ok ? "ok" : ep.ok === false ? "error" : "pending"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--bp-text3)", marginTop: 6 }}>{ep.desc}</div>
          </div>
        ))}
        <div style={S.divider} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={S.btn("accent")} onClick={onRefresh} disabled={loading}>
            {loading ? <Spin /> : <Icon name="refresh" size={12} />} Refresh all
          </button>
          {lastFetch && (
            <span style={{ fontSize: 11, fontFamily: "var(--bp-mono)", color: "var(--bp-text3)" }}>
              last fetch: {lastFetch}
            </span>
          )}
        </div>
      </div>
      {showModal && (
        <ApiKeyModal
          current={apiKey}
          onSave={onSaveKey}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Registry Page (main export) ───────────────────────────────────────────────
export default function Registry() {
  const [page, setPage] = useState("overview");
  const [data, setData] = useState<RegistryEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { path: "/entries", desc: "All registry entries", ok: null },
    { path: "/featured", desc: "Curated featured entries", ok: null },
  ]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const results: RegistryEntry[] = [];
    const newEndpoints = [...endpoints];
    const newErrors: Record<string, string> = {};

    await Promise.all([
      apiFetch("/featured", apiKey)
        .then((arr) => {
          arr.forEach((item) => results.push({ ...item, _source: "featured" }));
          setCounts((c) => ({ ...c, featured: arr.length }));
          newEndpoints[1] = { ...newEndpoints[1], ok: true };
        })
        .catch((e: Error) => {
          newErrors.featured = e.message;
          newEndpoints[1] = { ...newEndpoints[1], ok: false };
        }),
      apiFetch("/entries", apiKey)
        .then((arr) => {
          const featuredIds = new Set(results.map((d) => d.id ?? d.slug ?? d.name));
          arr.forEach((item) => {
            const key = item.id ?? item.slug ?? item.name;
            if (!featuredIds.has(key)) results.push({ ...item, _source: "entry" });
          });
          setCounts((c) => ({ ...c, entries: arr.length }));
          newEndpoints[0] = { ...newEndpoints[0], ok: true };
        })
        .catch((e: Error) => {
          newErrors.entries = e.message;
          newEndpoints[0] = { ...newEndpoints[0], ok: false };
        }),
    ]);

    setData(results);
    setEndpoints(newEndpoints);
    setErrors(newErrors);
    setLoading(false);
    setLastFetch(new Date().toLocaleTimeString());
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const combinedError = Object.values(errors).join(" · ") || null;

  const pages: Record<string, { label: string; icon: string }> = {
    overview: { label: "Overview", icon: "home" },
    entries: { label: "Entries", icon: "list" },
    featured: { label: "Featured", icon: "star" },
    settings: { label: "Settings", icon: "settings" },
  };

  const pageContent: Record<string, React.ReactNode> = {
    overview: (
      <OverviewPage
        data={data}
        counts={counts}
        loading={loading}
        error={combinedError}
        apiKey={apiKey}
      />
    ),
    entries: <EntriesPage data={data} loading={loading} error={errors.entries} />,
    featured: <FeaturedPage data={data} loading={loading} error={errors.featured} />,
    settings: (
      <SettingsPage
        apiKey={apiKey}
        onSaveKey={(k) => {
          setApiKey(k);
          setTimeout(fetchAll, 100);
        }}
        endpoints={endpoints}
        onRefresh={fetchAll}
        loading={loading}
        lastFetch={lastFetch}
      />
    ),
  };

  return (
    <>
      {/* Scoped CSS variables + keyframes for this page */}
      <style>{`
        .bp-root {
          --bp-bg:        #07080a;
          --bp-bg2:       #0e1014;
          --bp-bg3:       #14171c;
          --bp-bg4:       #1a1e25;
          --bp-border:    rgba(255,255,255,0.07);
          --bp-border2:   rgba(255,255,255,0.13);
          --bp-text:      #dde1e9;
          --bp-text2:     #7c8494;
          --bp-text3:     #404653;
          --bp-accent:    #22d3a0;
          --bp-accent2:   #19a87e;
          --bp-accent-bg: rgba(34,211,160,0.07);
          --bp-accent-b:  rgba(34,211,160,0.22);
          --bp-danger:    #f05c5c;
          --bp-danger-bg: rgba(240,92,92,0.08);
          --bp-warn:      #f0a742;
          --bp-warn-bg:   rgba(240,167,66,0.08);
          --bp-mono: 'IBM Plex Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }
        @keyframes bp-spin { to { transform: rotate(360deg); } }
        @keyframes bp-fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .bp-root ::-webkit-scrollbar { width: 3px; height: 3px; }
        .bp-root ::-webkit-scrollbar-track { background: transparent; }
        .bp-root ::-webkit-scrollbar-thumb { background: var(--bp-border2); border-radius: 2px; }
      `}</style>

      <div className="bp-root" style={{ ...S.layout, fontFamily: "'IBM Plex Mono', 'Inter', system-ui, sans-serif" }}>
        {/* Sidebar */}
        <aside style={S.sidebar}>
          <div style={S.sidebarInner}>
            <div style={S.logo}>
              <div style={S.logoPulse} />
              <span style={S.logoText}>BasePulse</span>
            </div>
            <nav style={S.nav}>
              <div style={S.navGroup}>Registry</div>
              {Object.entries(pages).map(([key, { label, icon }]) => (
                <div key={key} style={S.navItem(page === key)} onClick={() => setPage(key)}>
                  <Icon name={icon} size={13} />
                  {label}
                  {key === "entries" && data.filter((d) => d._source !== "featured").length > 0 && (
                    <span style={S.navBadge}>{data.filter((d) => d._source !== "featured").length}</span>
                  )}
                  {key === "featured" && data.filter((d) => d._source === "featured").length > 0 && (
                    <span style={S.navBadge}>{data.filter((d) => d._source === "featured").length}</span>
                  )}
                </div>
              ))}
            </nav>
            <div style={S.sidebarFooter}>
              <button style={S.apiKeyBtn} onClick={() => setShowKeyModal(true)}>
                <span style={{ color: apiKey ? "var(--bp-accent)" : "var(--bp-text3)" }}>
                  <Icon name="key" size={11} />
                </span>{" "}
                {apiKey ? "● key active" : "○ set api key"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={S.main}>
          <div style={S.topbar}>
            <div>
              <div style={S.topTitle}>{pages[page]?.label}</div>
              <div style={S.topSub}>base.org/api/registry</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {loading && <Spin />}
              <button style={S.btn("ghost")} onClick={fetchAll} disabled={loading}>
                <Icon name="refresh" size={12} /> Refresh
              </button>
            </div>
          </div>
          <div style={S.content}>{pageContent[page]}</div>
        </main>

        {showKeyModal && (
          <ApiKeyModal
            current={apiKey}
            onSave={(k) => {
              setApiKey(k);
              setShowKeyModal(false);
              setTimeout(fetchAll, 100);
            }}
            onClose={() => setShowKeyModal(false)}
          />
        )}
      </div>
    </>
  );
}
