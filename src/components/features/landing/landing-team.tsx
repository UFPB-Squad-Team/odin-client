"use client";

import { Users, ExternalLink } from "lucide-react";

const TEAM_MEMBERS = [
  {
    name: "Laboratório de Engenharia de Métodos e Aplicações (LEMA)",
    role: "Desenvolvimento e Pesquisa",
    institution: "Universidade Federal da Paraíba (UFPB)",
    description: "Laboratório responsável pelo desenvolvimento técnico e pesquisa aplicada do ODIN.",
    link: "https://www.ufpb.br",
  },
];

export function LandingTeam() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-cyan-50/30 py-24 dark:from-gray-950 dark:via-gray-900 dark:to-cyan-950/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_50%)]" />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
            <Users className="h-4 w-4" />
            Feito por Quem
          </div>
          
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Desenvolvido com{" "}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              excelência acadêmica
            </span>
          </h2>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            O ODIN é resultado de pesquisa aplicada e desenvolvimento tecnológico de ponta, 
            unindo dados públicos, visualização geoespacial e análise territorial.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl transition-transform group-hover:scale-150" />
              
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                      {member.role}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {member.institution}
                    </p>
                  </div>
                  
                  {member.link && (
                    <a
                      href={member.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      aria-label={`Visitar site de ${member.institution}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="hidden sm:inline">Visitar</span>
                    </a>
                  )}
                </div>
                
                <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  {member.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                    Pesquisa Aplicada
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    Dados Abertos
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                    Visualização Geoespacial
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Projeto desenvolvido com apoio de dados públicos do INEP (Censo Escolar) e IBGE (Malhas Territoriais).
          </p>
        </div>
      </div>
    </section>
  );
}
