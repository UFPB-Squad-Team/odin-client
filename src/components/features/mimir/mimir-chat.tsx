"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage } from "@/core/mimir-service";
import { PageContainer } from "@/components/layout/page-container";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function MimirChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Sou Mimir, o guardião do poço da sabedoria. Posso ajudar com informações sobre os dados do ODIN, análises territoriais, ou qualquer dúvida sobre o projeto. O que desejas saber?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Ajusta altura do textarea automaticamente
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage(trimmed);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao comunicar com Mimir";
      setError(errorMsg);
      console.error("Mimir chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition hover:opacity-80"
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            className="size-8"
            aria-hidden="true"
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="2"
              className="text-cyan-400 dark:text-cyan-500"
            />
            <circle
              cx="24"
              cy="24"
              r="10"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-cyan-400/60 dark:text-cyan-500/60"
            />
            <circle
              cx="24"
              cy="24"
              r="4"
              className="fill-cyan-400 dark:fill-cyan-500"
            />
          </svg>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Mimir
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Guardião do Poço da Sabedoria
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Voltar
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageContainer className="mx-auto max-w-3xl">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] sm:text-base ${
                    msg.role === "user"
                      ? "bg-cyan-500 text-zinc-950"
                      : "border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <svg
                        viewBox="0 0 48 48"
                        fill="none"
                        className="size-4"
                        aria-hidden="true"
                      >
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-cyan-400 dark:text-cyan-500"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="4"
                          className="fill-cyan-400 dark:fill-cyan-500"
                        />
                      </svg>
                      <span className="text-[11px] font-medium text-cyan-500 dark:text-cyan-400">
                        Mimir
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900 sm:max-w-[75%]">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      className="size-4"
                      aria-hidden="true"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-cyan-400 dark:text-cyan-500"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="4"
                        className="fill-cyan-400 dark:fill-cyan-500"
                      />
                    </svg>
                    <span className="text-[11px] font-medium text-cyan-500 dark:text-cyan-400">
                      Mimir
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="mimir-dot size-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500 [animation-delay:0ms]"></span>
                    <span className="mimir-dot size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms] dark:bg-zinc-500"></span>
                    <span className="mimir-dot size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms] dark:bg-zinc-500"></span>
                  </div>
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex justify-center">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  <span className="font-medium">Erro:</span>{" "}
                  {error}
                  <button
                    onClick={() => setError(null)}
                    className="ml-2 font-medium underline hover:no-underline"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </PageContainer>
      </div>

      <div className="border-t border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <PageContainer className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                disabled={isLoading}
                className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 pr-12 text-sm placeholder-zinc-400 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder-zinc-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-zinc-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 disabled:opacity-40 disabled:hover:bg-cyan-500"
              aria-label="Enviar mensagem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            As respostas são geradas por IA e podem conter imprecisões. Não há
            armazenamento de histórico.
          </p>
        </PageContainer>
      </div>
    </div>
  );
}