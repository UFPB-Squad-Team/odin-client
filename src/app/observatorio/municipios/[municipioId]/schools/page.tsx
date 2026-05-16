"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, MapPin, School2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { fetchEscolasByMunicipioPage } from "@/modules/educacao/services/education-api";
import type { Escola } from "@/core/types/territory";

function formatMaybeText(value: string | undefined | null) {
  if (!value) return "—";
  return value;
}

function SchoolCard({
  id,
  nome,
  municipio,
  bairro,
  dependencia,
  tipo,
  inepId,
}: {
  id: string;
  nome: string;
  municipio?: string | null;
  bairro?: string | null;
  dependencia?: string | null;
  tipo?: string | null;
  inepId?: string | null;
}) {
  return (
    <Link
      href={`/schools/${inepId ?? id}`}
      className="group rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950/70"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            Escola
          </p>
          <h2 className="mt-1 truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {nome}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
              <MapPin className="h-3 w-3" />
              {formatMaybeText(municipio)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
              <BookOpen className="h-3 w-3" />
              {formatMaybeText(bairro)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
              <School2 className="h-3 w-3" />
              {formatMaybeText(tipo)}
            </span>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/8 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
          INEP {formatMaybeText(inepId)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/70">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Dependência
          </p>
          <p className="mt-1 font-medium">{formatMaybeText(dependencia)}</p>
        </div>
        <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/70">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Tipo de localização
          </p>
          <p className="mt-1 font-medium">{formatMaybeText(tipo)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-cyan-700 transition group-hover:text-cyan-600 dark:text-cyan-300">
        Ver detalhes da escola →
      </p>
    </Link>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPage,
  loading,
  failedPages,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPage: (page: number) => void;
  loading: boolean;
  failedPages: Set<number>;
}) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Exibindo{" "}
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {from}–{to}
        </span>{" "}
        de{" "}
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalItems}</span>{" "}
        escolas
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-zinc-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p as number)}
              disabled={loading}
              title={failedPages.has(p as number) ? "Esta página teve erro ao carregar" : undefined}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition disabled:cursor-not-allowed ${
                failedPages.has(p as number)
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600/60 dark:bg-amber-900/20 dark:text-amber-400"
                  : p === currentPage
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/60 dark:text-cyan-300"
                    : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPage(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function MunicipalitySchoolsPage() {
  const params = useParams();
  const municipioId = String(params.municipioId ?? "");

  const [schools, setSchools] = useState<Escola[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [municipioNome, setMunicipioNome] = useState(municipioId);
  const [loading, setLoading] = useState(true);
  const [pageFailed, setPageFailed] = useState(false);
  const [failedPages, setFailedPages] = useState<Set<number>>(new Set());

  const loadPage = useCallback(
    async (page: number) => {
      if (!municipioId) return;
      setLoading(true);
      setPageFailed(false);

      const result = await fetchEscolasByMunicipioPage(municipioId, page);

      if (result.failed) {
        setPageFailed(true);
        setFailedPages((prev) => new Set(prev).add(page));
        setCurrentPage(page);
        setSchools([]);
      } else {
        setSchools(result.schools);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
        setPageSize(result.pageSize);
        setCurrentPage(result.currentPage);
        setPageFailed(false);

        if (result.schools[0]?.municipioNome) {
          setMunicipioNome(result.schools[0].municipioNome);
        }
      }

      setLoading(false);
    },
    [municipioId],
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const handlePage = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadPage(page);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.12),_transparent_35%),linear-gradient(180deg,_#fafafa,_#f4f7fb)] text-zinc-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.16),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a)] dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-zinc-200/70 bg-white/85 p-5 shadow-lg shadow-cyan-500/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                Escolas do município
              </p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                {municipioNome}
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {loading ? (
                  <span className="inline-block h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                ) : (
                  <>
                    {totalItems} escola{totalItems === 1 ? "" : "s"} encontrada
                    {totalItems === 1 ? "" : "s"}
                    {totalPages > 1 && (
                      <span className="ml-2 text-zinc-400 dark:text-zinc-500">
                        · página {currentPage} de {totalPages}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/observatorio"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao mapa
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/40"
              />
            ))}
          </section>
        ) : pageFailed ? (
          <section className="flex flex-col items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/80 p-6 dark:border-amber-700/40 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">
                Esta página não pôde ser carregada — alguns registros possuem dados inválidos no servidor.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadPage(currentPage)}
                className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 dark:border-amber-600 dark:bg-transparent dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                Tentar novamente
              </button>
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => handlePage(currentPage - 1)}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300"
                >
                  Ir para página anterior
                </button>
              )}
            </div>
          </section>
        ) : schools.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300">
            Nenhuma escola retornada para este município.
          </section>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {schools.map((school) => (
                <SchoolCard
                  key={school.inepId ?? school.id}
                  id={school.id}
                  nome={school.nome}
                  municipio={school.municipioNome}
                  bairro={school.bairroNome}
                  dependencia={school.dependencia_adm ?? school.dependenciaAdministrativa}
                  tipo={school.tipo_localizacao ?? school.tipoLocalizacao}
                  inepId={school.inepId}
                />
              ))}
            </section>

            <div className="rounded-2xl border border-zinc-200/70 bg-white/85 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 sm:px-6">
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPage={handlePage}
                loading={loading}
                failedPages={failedPages}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}