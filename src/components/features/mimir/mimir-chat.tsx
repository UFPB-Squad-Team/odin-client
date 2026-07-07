"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, COLECOES_DISPONIVEIS } from "@/core/mimir-service";
import type { MimirResponse } from "@/core/mimir-service";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Send,
  Plus,
  Copy,
  RefreshCw,
  User,
  Check,
  Filter,
  ChevronDown,
  Table2,
  Trash2,
  MessageSquare,
  AlertTriangle,
  Zap,
  Database,
  WifiOff,
} from "lucide-react";

/* ─── Design tokens ODIN ─────────────────────────────── */
const lightTheme = {
  canvas: "#f4f4f5",
  surface: "#ffffff",
  textPrimary: "#18181b",
  textSecondary: "#3f3f46",
  textMuted: "#a1a1aa",
  border: "#d4d4d8",
  brandDark: "#1C3F3A",
  brandCyan: "#06b6d4",
  brandCyanLight: "#22d3ee",
  danger: "#dc2626",
  dangerBg: "rgba(220,38,38,0.1)",
  success: "#16a34a",
  successBg: "rgba(22,163,74,0.1)",
  warning: "#f59e0b",
  warningBg: "rgba(245,158,11,0.1)",
};

const darkTheme = {
  canvas: "#0a0a0b",
  surface: "#18181b",
  textPrimary: "#f4f4f5",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  border: "#27272a",
  brandDark: "#22d3ee",
  brandCyan: "#06b6d4",
  brandCyanLight: "#22d3ee",
  danger: "#ef4444",
  dangerBg: "rgba(239,68,68,0.15)",
  success: "#22c55e",
  successBg: "rgba(34,197,94,0.15)",
  warning: "#f59e0b",
  warningBg: "rgba(245,158,11,0.15)",
};

/* ─── Types ─────────────────────────────────────────── */
type Role = "user" | "mimir";
interface Message {
  id: number;
  role: Role;
  content: string;
  time: string;
  colecoes?: string[];
  component?: "text" | "table";
  payload?: Record<string, unknown>[];
  colunas?: string[];
  rotulos?: string[];
  /** @deprecated kept for backwards compat, use fonte */
  fonte?: string;
  /** @deprecated kept for backwards compat, use confianca */
  confianca?: string;
  /** Fonte da resposta vinda do backend */
  fonte_backend?: string;
  /** Nível de confiança vindo do backend */
  confianca_backend?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  selectedColecoes: string[];
  createdAt: number;
  updatedAt: number;
}

/* ─── localStorage helpers ──────────────────────────── */
const STORAGE_KEY = "odin-mimir-chats";

function loadChats(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: ChatSession[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // ignore quota errors
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/* ─── Confirm Modal ─────────────────────────────────── */
function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onCancel}
      >
        <div
          style={{
            background: "var(--surface, #fff)",
            borderRadius: 16,
            padding: "24px",
            maxWidth: 380,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <AlertTriangle size={20} color="#dc2626" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #3f3f46)", marginBottom: 20, lineHeight: 1.5 }}>
            {message}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border, #d4d4d8)",
                background: "transparent",
                color: "var(--text-primary, #18181b)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#dc2626",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Mimir typing dots ─────────────────────────────── */
function MimirDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--brand-cyan, #06b6d4)",
            display: "inline-block",
            animation: "mimirBounce 1.4s infinite ease-in-out both",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Mimir circular icon ──────────────────────────── */
function MimirIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" width={size} height={size} aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
    </svg>
  );
}

/* ─── Confidence badge ──────────────────────────────── */
function ConfidenceBadge({
  confianca,
  colors,
}: {
  confianca: string;
  colors: typeof lightTheme;
}) {
  const config: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    alta: {
      label: "Alta confiança",
      bg: colors.successBg,
      color: colors.success,
      icon: <Check size={10} strokeWidth={3} />,
    },
    media: {
      label: "Confiança média",
      bg: colors.warningBg,
      color: colors.warning,
      icon: <AlertTriangle size={10} strokeWidth={1.5} />,
    },
    baixa: {
      label: "Baixa confiança",
      bg: colors.dangerBg,
      color: colors.danger,
      icon: <AlertTriangle size={10} strokeWidth={1.5} />,
    },
  };

  const c = config[confianca] || config.alta;

  return (
    <span
      style={{
        fontSize: 10,
        color: c.color,
        background: c.bg,
        padding: "2px 8px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        whiteSpace: "nowrap",
      }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

/* ─── Source badge ──────────────────────────────────── */
function SourceBadge({
  fonte,
  colors,
}: {
  fonte: string;
  colors: typeof lightTheme;
}) {
  const config: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    rag: {
      label: "RAG",
      bg: "rgba(6,182,212,0.08)",
      color: colors.brandCyan,
      icon: <Database size={10} strokeWidth={1.5} />,
    },
    cache: {
      label: "Cache",
      bg: colors.successBg,
      color: colors.success,
      icon: <Zap size={10} strokeWidth={1.5} />,
    },
    fallback: {
      label: "Fallback",
      bg: colors.warningBg,
      color: colors.warning,
      icon: <WifiOff size={10} strokeWidth={1.5} />,
    },
  };

  const c = config[fonte] || config.rag;

  return (
    <span
      style={{
        fontSize: 10,
        color: c.color,
        background: c.bg,
        padding: "2px 8px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        whiteSpace: "nowrap",
      }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

/* ─── Data Table component ──────────────────────────── */
function DataTable({
  payload,
  colunas,
  rotulos,
}: {
  payload: Record<string, unknown>[];
  colunas: string[];
  rotulos: string[];
}) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = [...payload].sort((a, b) => {
    if (!sortCol) return 0;
    const va = a[sortCol];
    const vb = b[sortCol];
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") {
      return sortDir === "asc" ? va - vb : vb - va;
    }
    return sortDir === "asc"
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const formatVal = (val: unknown): string => {
    if (val == null || val === "-" || val === "não informado") return "-";
    if (typeof val === "number") {
      if (Number.isInteger(val)) return val.toLocaleString("pt-BR");
      return val.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    }
    return String(val);
  };

  return (
    <div style={{ overflowX: "auto", marginTop: 8, borderRadius: 12, border: `1px solid var(--border, #d4d4d8)` }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <thead>
          <tr style={{ background: "var(--canvas, #f4f4f5)" }}>
            {rotulos.map((rotulo, i) => (
              <th
                key={colunas[i] || i}
                onClick={() => handleSort(colunas[i])}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "var(--text-secondary, #3f3f46)",
                  borderBottom: `2px solid var(--border, #d4d4d8)`,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  userSelect: "none",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {rotulo}
                {sortCol === colunas[i] && (
                  <span style={{ marginLeft: 4, color: "var(--brand-cyan, #06b6d4)" }}>
                    {sortDir === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              style={{
                background: rowIdx % 2 === 0 ? "var(--surface, #fff)" : "var(--canvas, #f4f4f5)",
                transition: "background 100ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background = "rgba(6,182,212,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background =
                  rowIdx % 2 === 0 ? "var(--surface, #fff)" : "var(--canvas, #f4f4f5)";
              }}
            >
              {colunas.map((col) => (
                <td
                  key={col}
                  style={{
                    padding: "8px 12px",
                    borderBottom: `1px solid var(--border, #d4d4d8)`,
                    color: "var(--text-primary, #18181b)",
                    whiteSpace: "nowrap",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {formatVal(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{
          padding: "8px 12px",
          fontSize: 10,
          color: "var(--text-muted, #a1a1aa)",
          borderTop: `1px solid var(--border, #d4d4d8)`,
          background: "var(--surface, #fff)",
        }}
      >
        {payload.length} registro(s) — Clique nos cabeçalhos para ordenar
      </div>
    </div>
  );
}

/* ─── Sidebar ───────────────────────────────────────── */
function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  colors,
}: {
  chats: ChatSession[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  colors: typeof lightTheme;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <>
      <ConfirmModal
        open={deleteId !== null}
        title="Excluir conversa"
        message="Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita."
        onConfirm={() => {
          if (deleteId) onDeleteChat(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
      <div
        style={{
          width: 260,
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          flexShrink: 0,
        }}
      >
        {/* Logo + Brand */}
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${colors.border}` }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              textDecoration: "none",
            }}
          >
            <MimirIcon size={32} />
            <span style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.02em" }}>
              ODIN
            </span>
          </Link>

          <button
            onClick={onNewChat}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: colors.brandDark,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            <Plus size={14} />
            Nova conversa
          </button>
        </div>

        {/* Chat history list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          {chats.length === 0 ? (
            <div style={{ padding: "20px 10px", textAlign: "center", color: colors.textMuted, fontSize: 12 }}>
              Nenhuma conversa ainda
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onMouseEnter={() => setHoveredId(chat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ position: "relative" }}
                >
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: chat.id === activeChatId ? colors.canvas : "transparent",
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: chat.id === activeChatId ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 100ms ease",
                    }}
                  >
                    <MessageSquare size={14} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chat.title}
                    </span>
                  </button>
                  {hoveredId === chat.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(chat.id);
                      }}
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: colors.textMuted,
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = colors.danger;
                        (e.currentTarget as HTMLButtonElement).style.background = colors.dangerBg;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted;
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                      title="Excluir conversa"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link para o observatório */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${colors.border}` }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 0",
              fontSize: 12,
              color: colors.textSecondary,
              textDecoration: "none",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = colors.brandCyan; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = colors.textSecondary; }}
          >
            ← Explorar dados no observatório
          </Link>
        </div>
      </div>
    </>
  );
}

/* ─── Message bubble ────────────────────────────────── */
function MessageBubble({ msg, colors }: { msg: Message; colors: typeof lightTheme }) {
  const isUser = msg.role === "user";
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isTable = msg.component === "table" && msg.payload && msg.payload.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 10,
        alignItems: "flex-start",
        maxWidth: "100%",
        padding: "4px 0",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          style={{
            width: 32,
            minWidth: 32,
            height: 32,
            borderRadius: "50%",
            background: colors.canvas,
            border: `2px solid ${colors.brandCyanLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MimirIcon size={18} />
        </div>
      )}
      {isUser && (
        <div
          style={{
            width: 32,
            minWidth: 32,
            height: 32,
            borderRadius: "50%",
            background: colors.brandDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={15} color="#fff" strokeWidth={1.5} />
        </div>
      )}

      <div style={{ maxWidth: "76%", minWidth: 0, overflowWrap: "break-word", wordBreak: "break-word" }}>
        {/* Name + metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            flexWrap: "wrap",
            flexDirection: isUser ? "row-reverse" : "row",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: isUser ? colors.textSecondary : colors.textPrimary }}>
            {isUser ? "Você" : "Mimir"}
          </span>

          {msg.colecoes && msg.colecoes.length > 0 && (
            <span
              style={{
                fontSize: 10,
                color: colors.textMuted,
                background: colors.canvas,
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {msg.colecoes.join(", ")}
            </span>
          )}
          {isTable && (
            <span
              style={{
                fontSize: 10,
                color: colors.brandCyan,
                background: "rgba(6,182,212,0.08)",
                padding: "2px 8px",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Table2 size={10} strokeWidth={1.5} />
              Tabela
            </span>
          )}
          <span style={{ fontSize: 11, color: colors.textMuted }}>{msg.time}</span>
        </div>

        {/* Table content */}
        {isTable && msg.payload && msg.colunas && msg.rotulos && (
          <div
            style={{
              background: colors.surface,
              borderRadius: "4px 16px 16px 16px",
              padding: "6px",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <DataTable payload={msg.payload} colunas={msg.colunas} rotulos={msg.rotulos} />
          </div>
        )}

        {/* Text bubble */}
        {msg.content && (
          <div
            style={{
              background: isTable ? "transparent" : isUser ? colors.brandDark : colors.surface,
              color: isUser && !isTable ? "#fff" : colors.textPrimary,
              borderRadius: isUser
                ? "16px 4px 16px 16px"
                : isTable
                  ? 0
                  : "4px 16px 16px 16px",
              padding: isTable ? "8px 0 0 0" : "14px 18px",
              fontSize: 14,
              lineHeight: 1.65,
              boxShadow: isUser || isTable ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
              border: isUser ? "none" : isTable ? "none" : `1px solid ${colors.border}`,
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
          >
            <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>{msg.content}</p>
          </div>
        )}

        {/* Action row */}
        {!isUser && hovered && (
          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 6,
              opacity: hovered ? 1 : 0,
              transition: "opacity 150ms ease",
            }}
          >
            <button
              title="Copiar"
              onClick={handleCopy}
              style={{
                background: "transparent",
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: "4px 10px",
                cursor: "pointer",
                color: copied ? "#16a34a" : colors.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = colors.textPrimary;
                (e.currentTarget as HTMLButtonElement).style.background = colors.canvas;
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted;
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }
              }}
            >
              {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Collection filter dropdown ────────────────────── */
function CollectionFilter({
  selected,
  onToggle,
  colors,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  colors: typeof lightTheme;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          borderRadius: 999,
          border: `1px solid ${selected.length > 0 ? colors.brandCyan : colors.border}`,
          background: selected.length > 0 ? "rgba(6,182,212,0.06)" : colors.surface,
          color: selected.length > 0 ? colors.brandCyan : colors.textSecondary,
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 150ms ease",
          whiteSpace: "nowrap",
        }}
      >
        <Filter size={12} strokeWidth={1.5} />
        {selected.length === 0 ? "Todas as bases" : `${selected.length} selecionada(s)`}
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
        />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: 0,
              zIndex: 10,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              boxShadow: "0 -4px 16px rgba(0,0,0,0.1)",
              padding: "8px",
              minWidth: 210,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "4px 8px 8px",
              }}
            >
              Filtrar por base
            </div>
            {COLECOES_DISPONIVEIS.map((c) => (
              <button
                key={c.id}
                onClick={() => onToggle(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: selected.includes(c.id) ? "rgba(6,182,212,0.08)" : "transparent",
                  color: selected.includes(c.id) ? colors.brandCyan : colors.textSecondary,
                  fontSize: 13,
                  fontWeight: selected.includes(c.id) ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 100ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!selected.includes(c.id)) {
                    (e.currentTarget as HTMLButtonElement).style.background = colors.canvas;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected.includes(c.id)) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }
                }}
              >
                <span>{c.icon}</span>
                <span style={{ flex: 1 }}>{c.label}</span>
                {selected.includes(c.id) && <Check size={12} strokeWidth={3} color={colors.brandCyan} />}
              </button>
            ))}
            {selected.length > 0 && (
              <button
                onClick={() => {
                  COLECOES_DISPONIVEIS.forEach((c) => {
                    if (selected.includes(c.id)) onToggle(c.id);
                  });
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: "transparent",
                  color: colors.textMuted,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Input bar ─────────────────────────────────────── */
function InputBar({
  onSend,
  selectedColecoes,
  onToggleColecao,
  externalValue,
  onExternalValueChange,
  ignoreCache,
  onToggleIgnoreCache,
  colors,
}: {
  onSend: (text: string) => void;
  selectedColecoes: string[];
  onToggleColecao: (id: string) => void;
  externalValue: string;
  onExternalValueChange: (val: string) => void;
  ignoreCache: boolean;
  onToggleIgnoreCache: () => void;
  colors: typeof lightTheme;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!externalValue.trim()) return;
    onSend(externalValue.trim());
    onExternalValueChange("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const suggestions = [
    "Liste os bairros de João Pessoa",
    "Escolas com melhor IDEB",
    "População por município PB",
    "Taxa de analfabetismo",
  ];

  return (
    <div style={{ padding: "16px 24px 20px", background: colors.canvas, borderTop: `1px solid ${colors.border}` }}>
      {/* Filters + suggestion chips */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "flex-start",
        }}
      >
        <span style={{ flexShrink: 0 }}>
          <CollectionFilter selected={selectedColecoes} onToggle={onToggleColecao} colors={colors} />
        </span>

        {/* Ignore cache toggle */}
        <button
          onClick={onToggleIgnoreCache}
          title={ignoreCache ? "Cache ignorado — respostas sempre frescas" : "Usar cache — respostas mais rápidas"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "7px 12px",
            borderRadius: 999,
            border: `1px solid ${ignoreCache ? colors.warning : colors.border}`,
            background: ignoreCache ? colors.warningBg : colors.surface,
            color: ignoreCache ? colors.warning : colors.textMuted,
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 150ms ease",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <Zap size={12} strokeWidth={1.5} />
          {ignoreCache ? "Cache off" : "Cache on"}
        </button>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
            alignItems: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                onExternalValueChange(s);
                textareaRef.current?.focus();
              }}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
                color: colors.textSecondary,
                cursor: "pointer",
                transition: "all 150ms ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = colors.textMuted;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = colors.border;
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input row */}
      <div
        style={{
          background: colors.surface,
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          padding: "10px 10px 10px 18px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={externalValue}
          onChange={(e) => {
            onExternalValueChange(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Pergunte sobre os dados do ODIN..."
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            lineHeight: 1.6,
            color: colors.textPrimary,
            fontFamily: "Inter, system-ui, sans-serif",
            maxHeight: 120,
            overflowY: "auto",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!externalValue.trim()}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: externalValue.trim() ? colors.brandDark : colors.canvas,
            border: externalValue.trim() ? "none" : `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: externalValue.trim() ? "pointer" : "default",
            transition: "all 200ms ease",
            flexShrink: 0,
          }}
        >
          <Send size={15} color={externalValue.trim() ? "#fff" : colors.textMuted} strokeWidth={2} />
        </button>
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontSize: 11, color: colors.textMuted }}>
          Mimir pode cometer erros. Sempre valide dados críticos nas fontes oficiais.
        </span>
        {ignoreCache && (
          <span style={{ fontSize: 11, color: colors.warning, fontStyle: "italic" }}>
            Cache desativado — respostas podem ser mais lentas
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Chat area ─────────────────────────────────────── */
function ChatArea({
  onNewChatRef,
  colors,
  activeChatId,
  chats,
  onSelectChat,
  onCreateNewChat,
}: {
  onNewChatRef?: React.MutableRefObject<(() => void) | undefined>;
  colors: typeof lightTheme;
  activeChatId: string | null;
  chats: ChatSession[];
  onSelectChat: (id: string) => void;
  onCreateNewChat: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColecoes, setSelectedColecoes] = useState<string[]>([]);
  const [ignoreCache, setIgnoreCache] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const prevActiveChatRef = useRef<string | null>(null);


  useEffect(() => {
    if (prevActiveChatRef.current && prevActiveChatRef.current !== activeChatId && messages.length > 0) {
      const prevId = prevActiveChatRef.current;
      const updated = chats.map((c) => {
        if (c.id === prevId) {
          return { ...c, messages, selectedColecoes, updatedAt: Date.now() };
        }
        return c;
      });
      saveChats(updated);
    }

    prevActiveChatRef.current = activeChatId;

    if (activeChatId) {
      const chat = chats.find((c) => c.id === activeChatId);
      if (chat && chat.messages.length > 0) {
        setMessages(chat.messages);
        setSelectedColecoes(chat.selectedColecoes);
        const maxId = chat.messages.reduce((max, msg) => Math.max(max, msg.id), 0);
        nextId.current = maxId + 1;
        setInputValue("");
      } else {
        setMessages([
          {
            id: 1,
            role: "mimir",
            time: "",
            content:
              "Olá! Sou o **Mimir**, seu assistente de dados do Nordeste. 👋\n\nPosso te ajudar a consultar dados sobre escolas, municípios, bairros e setores censitários. Use o filtro de bases para refinar sua busca.",
            fonte_backend: "rag",
            confianca_backend: "alta",
          },
        ]);
        setSelectedColecoes([]);
        setInputValue("");
        nextId.current = 2;
      }
    } else {
      setMessages([
        {
          id: 1,
          role: "mimir",
          time: "",
          content:
            "Olá! Sou o **Mimir**, seu assistente de dados do Nordeste. 👋\n\nPosso te ajudar a consultar dados sobre escolas, municípios, bairros e setores censitários. Use o filtro de bases para refinar sua busca.",
          fonte_backend: "rag",
          confianca_backend: "alta",
        },
      ]);
      setSelectedColecoes([]);
      setInputValue("");
      nextId.current = 2;
    }
  }, [activeChatId, chats]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      const updated = chats.map((c) => {
        if (c.id === activeChatId) {
          return { ...c, messages, selectedColecoes, updatedAt: Date.now() };
        }
        return c;
      });
      saveChats(updated);
    }
  }, [messages, activeChatId, chats, selectedColecoes]);

  const toggleColecao = (id: string) => {
    setSelectedColecoes((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSend = async (text: string) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const userMsg: Message = {
      id: nextId.current++,
      role: "user",
      time,
      content: text,
      colecoes: selectedColecoes.length > 0 ? selectedColecoes : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data: MimirResponse = await sendMessage(text, selectedColecoes, ignoreCache);

      const mimirMsg: Message = {
        id: nextId.current++,
        role: "mimir",
        time,
        content: data.resposta,
        colecoes: data.colecoes_consultadas,
        component: data.component || "text",
        payload: data.payload || [],
        colunas: data.colunas || [],
        rotulos: data.rotulos || [],
        fonte_backend: data.fonte || "rag",
        confianca_backend: data.confianca || "alta",
      };

      setMessages((prev) => [...prev, mimirMsg]);
    } catch (err) {
      console.error("Mimir chat error:", err);

      const errorMessage: Message = {
        id: nextId.current++,
        role: "mimir",
        time,
        content: `**Não foi possível processar sua pergunta.**\n\n${
          err instanceof Error ? err.message : "Erro desconhecido"
        }\n\nTente novamente em alguns instantes. Se o problema persistir, verifique se o servidor está ativo.`,
        fonte_backend: "fallback",
        confianca_backend: "baixa",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = useCallback(() => {
    onCreateNewChat();
  }, [onCreateNewChat]);

  useEffect(() => {
    if (onNewChatRef) {
      onNewChatRef.current = createNewChat;
    }
    return () => {
      if (onNewChatRef) {
        onNewChatRef.current = undefined;
      }
    };
  }, [onNewChatRef, createNewChat]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: colors.canvas }}>
      {/* Header */}
      <div
        style={{
          height: 60,
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: colors.canvas,
              border: `2px solid ${colors.brandCyanLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MimirIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, display: "flex", alignItems: "center", gap: 6 }}>
              Mimir
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>IA de dados do Nordeste</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 16px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} colors={colors} />
          ))}

          {isLoading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: colors.canvas,
                  border: `2px solid ${colors.brandCyanLight}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MimirIcon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary, marginBottom: 6 }}>Mimir</div>
                <div
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "4px 16px 16px 16px",
                    padding: "12px 16px",
                    display: "inline-block",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <MimirDots />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <InputBar
        onSend={handleSend}
        selectedColecoes={selectedColecoes}
        onToggleColecao={toggleColecao}
        externalValue={inputValue}
        onExternalValueChange={setInputValue}
        ignoreCache={ignoreCache}
        onToggleIgnoreCache={() => setIgnoreCache((prev) => !prev)}
        colors={colors}
      />
    </div>
  );
}

/* ─── Root ──────────────────────────────────────────── */
export function MimirChat() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const sidebarNewChatRef = useRef<() => void>();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const loaded = loadChats();
    setChats(loaded);
    if (loaded.length > 0) {
      setActiveChatId(loaded[0].id);
    }
  }, []);

  const handleNewChatFromSidebar = useCallback(() => {
    sidebarNewChatRef.current?.();
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    saveChats(updated);
    if (activeChatId === id) {
      setActiveChatId(updated.length > 0 ? updated[0].id : null);
    }
  }, [chats, activeChatId]);

  // Invert theme: dark site → light chat, light site → dark chat
  const colors = mounted && resolvedTheme === "dark" ? lightTheme : darkTheme;

  return (
    <>
      <style>{`
        @keyframes mimirBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: #a1a1aa; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 99px; }
        strong { font-weight: 600; }
        
        /* DataTable hover */
        table tbody tr:hover td {
          background: rgba(6,182,212,0.08) !important;
        }
      `}</style>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: colors.canvas,
          color: colors.textPrimary,
        }}
      >
        <Sidebar
          chats={chats}
          activeChatId={activeChatId || ""}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChatFromSidebar}
          onDeleteChat={handleDeleteChat}
          colors={colors}
        />
        <ChatArea
          onNewChatRef={sidebarNewChatRef}
          colors={colors}
          activeChatId={activeChatId}
          chats={chats}
          onSelectChat={handleSelectChat}
          onCreateNewChat={() => {
            const newChat: ChatSession = {
              id: generateId(),
              title: "Nova conversa",
              messages: [
                {
                  id: 1,
                  role: "mimir",
                  time: "",
                  content:
                    "Olá! Sou o **Mimir**, seu assistente de dados do Nordeste. 👋\n\nPosso te ajudar a consultar dados sobre escolas, municípios, bairros e setores censitários. Use o filtro de bases para refinar sua busca.",
                  fonte_backend: "rag",
                  confianca_backend: "alta",
                },
              ],
              selectedColecoes: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            const allChats = loadChats();
            allChats.unshift(newChat);
            saveChats(allChats);
            setChats(allChats);
            setActiveChatId(newChat.id);
          }}
        />
      </div>
    </>
  );
}