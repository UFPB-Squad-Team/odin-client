"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, COLECOES_DISPONIVEIS } from "@/core/mimir-service";
import type { MimirResponse } from "@/core/mimir-service";
import Link from "next/link";
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
} from "lucide-react";

/* ─── Design tokens ODIN ─────────────────────────────── */
const t = {
  canvas: "#f4f4f5",
  surface: "#ffffff",
  textPrimary: "#18181b",
  textSecondary: "#3f3f46",
  textMuted: "#a1a1aa",
  border: "#d4d4d8",
  brandDark: "#1C3F3A",
  brandCyan: "#06b6d4",
  brandCyanLight: "#22d3ee",
};

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
            background: t.brandCyan,
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
      <circle cx="24" cy="24" r="20" stroke={t.brandCyan} strokeWidth="2" />
      <circle cx="24" cy="24" r="10" stroke={t.brandCyan} strokeWidth="1.5" opacity="0.6" />
      <circle cx="24" cy="24" r="4" fill={t.brandCyan} />
    </svg>
  );
}

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
    <div style={{ overflowX: "auto", marginTop: 8, borderRadius: 12, border: `1px solid ${t.border}` }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <thead>
          <tr style={{ background: t.canvas }}>
            {rotulos.map((rotulo, i) => (
              <th
                key={colunas[i] || i}
                onClick={() => handleSort(colunas[i])}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  fontWeight: 700,
                  color: t.textSecondary,
                  borderBottom: `2px solid ${t.border}`,
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
                  <span style={{ marginLeft: 4, color: t.brandCyan }}>
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
                background: rowIdx % 2 === 0 ? t.surface : t.canvas,
                transition: "background 100ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background = "#e8f4f8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background =
                  rowIdx % 2 === 0 ? t.surface : t.canvas;
              }}
            >
              {colunas.map((col) => (
                <td
                  key={col}
                  style={{
                    padding: "8px 12px",
                    borderBottom: `1px solid ${t.border}`,
                    color: t.textPrimary,
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
          color: t.textMuted,
          borderTop: `1px solid ${t.border}`,
          background: t.surface,
        }}
      >
        {payload.length} registro(s) — Clique nos cabeçalhos para ordenar
      </div>
    </div>
  );
}

/* ─── Sidebar ───────────────────────────────────────── */
function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div
      style={{
        width: 220,
        background: t.surface,
        borderRight: `1px solid ${t.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flexShrink: 0,
      }}
    >
      {/* Logo + Brand */}
      <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${t.border}` }}>
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
          <span style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.02em" }}>
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
            background: t.brandDark,
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

      {/* Navigation — apenas Chat no momento */}
      <div style={{ padding: "12px 10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 10,
            background: t.canvas,
          }}
        >
          <MimirIcon size={18} />
          <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>Chat</span>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Link para o observatório */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}` }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 0",
            fontSize: 12,
            color: t.textSecondary,
            textDecoration: "none",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.brandCyan; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.textSecondary; }}
        >
          ← Explorar dados no observatório
        </Link>
      </div>
    </div>
  );
}

/* ─── Message bubble ────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
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
            background: t.canvas,
            border: `2px solid ${t.brandCyanLight}`,
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
            background: t.brandDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={15} color="#fff" strokeWidth={1.5} />
        </div>
      )}

      <div style={{ maxWidth: "76%", minWidth: 0 }}>
        {/* Name + time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            flexDirection: isUser ? "row-reverse" : "row",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: isUser ? t.textSecondary : t.textPrimary }}>
            {isUser ? "Você" : "Mimir"}
          </span>
          {msg.colecoes && msg.colecoes.length > 0 && (
            <span
              style={{
                fontSize: 10,
                color: t.textMuted,
                background: t.canvas,
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
                color: t.brandCyan,
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
          <span style={{ fontSize: 11, color: t.textMuted }}>{msg.time}</span>
        </div>

        {/* Table content */}
        {isTable && msg.payload && msg.colunas && msg.rotulos && (
          <div
            style={{
              background: t.surface,
              borderRadius: "4px 16px 16px 16px",
              padding: "6px",
              border: `1px solid ${t.border}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <DataTable
              payload={msg.payload}
              colunas={msg.colunas}
              rotulos={msg.rotulos}
            />
          </div>
        )}

        {/* Text bubble */}
        {msg.content && (
          <div
            style={{
              background: isTable ? "transparent" : isUser ? t.brandDark : t.surface,
              color: isUser && !isTable ? "#fff" : t.textPrimary,
              borderRadius: isUser
                ? "16px 4px 16px 16px"
                : isTable
                ? 0
                : "4px 16px 16px 16px",
              padding: isTable ? "8px 0 0 0" : "14px 18px",
              fontSize: 14,
              lineHeight: 1.65,
              boxShadow: isUser || isTable ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
              border: isUser ? "none" : isTable ? "none" : `1px solid ${t.border}`,
              wordBreak: "break-word",
            }}
          >
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
          </div>
        )}

        {/* Action row — Copiar e Regenerar apenas */}
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
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: "4px 10px",
                cursor: "pointer",
                color: copied ? "#16a34a" : t.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = t.textPrimary;
                (e.currentTarget as HTMLButtonElement).style.background = t.canvas;
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }
              }}
            >
              {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button
              title="Regenerar"
              style={{
                background: "transparent",
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: "4px 10px",
                cursor: "pointer",
                color: t.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = t.textPrimary;
                (e.currentTarget as HTMLButtonElement).style.background = t.canvas;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <RefreshCw size={12} strokeWidth={1.5} />
              Regenerar
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
}: {
  selected: string[];
  onToggle: (id: string) => void;
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
          border: `1px solid ${selected.length > 0 ? t.brandCyan : t.border}`,
          background: selected.length > 0 ? "rgba(6,182,212,0.06)" : t.surface,
          color: selected.length > 0 ? t.brandCyan : t.textSecondary,
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
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 10,
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              padding: "8px",
              minWidth: 210,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: t.textMuted,
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
                  color: selected.includes(c.id) ? t.brandCyan : t.textSecondary,
                  fontSize: 13,
                  fontWeight: selected.includes(c.id) ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 100ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!selected.includes(c.id)) {
                    (e.currentTarget as HTMLButtonElement).style.background = t.canvas;
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
                {selected.includes(c.id) && <Check size={12} strokeWidth={3} color={t.brandCyan} />}
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
                  border: `1px solid ${t.border}`,
                  background: "transparent",
                  color: t.textMuted,
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
}: {
  onSend: (text: string) => void;
  selectedColecoes: string[];
  onToggleColecao: (id: string) => void;
  externalValue: string;
  onExternalValueChange: (val: string) => void;
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
    <div style={{ padding: "16px 24px 20px", background: t.canvas, borderTop: `1px solid ${t.border}` }}>
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
          <CollectionFilter selected={selectedColecoes} onToggle={onToggleColecao} />
        </span>
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
                background: "rgba(255,255,255,0.7)",
                border: `1px solid ${t.border}`,
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
                color: t.textSecondary,
                cursor: "pointer",
                transition: "all 150ms ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = t.surface;
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.7)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = t.border;
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
          background: t.surface,
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: `1px solid ${t.border}`,
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
            color: t.textPrimary,
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
            background: externalValue.trim() ? t.brandDark : t.canvas,
            border: externalValue.trim() ? "none" : `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: externalValue.trim() ? "pointer" : "default",
            transition: "all 200ms ease",
            flexShrink: 0,
          }}
        >
          <Send size={15} color={externalValue.trim() ? "#fff" : t.textMuted} strokeWidth={2} />
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 10 }}>
        <span style={{ fontSize: 11, color: t.textMuted }}>
          Mimir pode cometer erros. Sempre valide dados críticos nas fontes oficiais.
        </span>
      </div>
    </div>
  );
}

/* ─── Chat area ─────────────────────────────────────── */
function ChatArea({ onNewChatRef }: { onNewChatRef?: React.MutableRefObject<(() => void) | undefined> }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "mimir",
      time: "",
      content:
        "Olá! Sou o **Mimir**, seu assistente de dados do Nordeste. 👋\n\nPosso te ajudar a consultar dados sobre escolas, municípios, bairros e setores censitários. Use o filtro de bases para refinar sua busca.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColecoes, setSelectedColecoes] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(2);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

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
      const data: MimirResponse = await sendMessage(text, selectedColecoes);

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
      };

      setMessages((prev) => [...prev, mimirMsg]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao comunicar com Mimir";
      console.error("Mimir chat error:", err);

      const errorMessage: Message = {
        id: nextId.current++,
        role: "mimir",
        time,
        content: `❌ **Erro:** ${errorMsg}\n\nTente novamente ou verifique se o servidor está rodando.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = useCallback(() => {
    setMessages([
      {
        id: 1,
        role: "mimir",
        time: "",
        content:
          "Olá! Sou o **Mimir**, seu assistente de dados do Nordeste. 👋\n\nPosso te ajudar a consultar dados sobre escolas, municípios, bairros e setores censitários. Use o filtro de bases para refinar sua busca.",
      },
    ]);
    setSelectedColecoes([]);
    setInputValue("");
    nextId.current = 2;
  }, []);

  useEffect(() => {
    if (onNewChatRef) {
      onNewChatRef.current = handleNewChat;
    }
    return () => {
      if (onNewChatRef) {
        onNewChatRef.current = undefined;
      }
    };
  }, [onNewChatRef, handleNewChat]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: t.canvas }}>
      {/* Header */}
      <div
        style={{
          height: 60,
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
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
              background: t.canvas,
              border: `2px solid ${t.brandCyanLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MimirIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, display: "flex", alignItems: "center", gap: 6 }}>
              Mimir
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            </div>
            <div style={{ fontSize: 11, color: t.textMuted }}>IA de dados do Nordeste</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 16px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {isLoading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: t.canvas,
                  border: `2px solid ${t.brandCyanLight}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MimirIcon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary, marginBottom: 6 }}>Mimir</div>
                <div
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
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
      />
    </div>
  );
}

/* ─── Root ──────────────────────────────────────────── */
export function MimirChat() {
  const sidebarNewChatRef = useRef<() => void>();

  const handleNewChatFromSidebar = useCallback(() => {
    sidebarNewChatRef.current?.();
  }, []);

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
          background: #e8f4f8 !important;
        }
      `}</style>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: t.canvas,
        }}
      >
        <Sidebar onNewChat={handleNewChatFromSidebar} />
        <ChatArea onNewChatRef={sidebarNewChatRef} />
      </div>
    </>
  );
}