
export type EducationLevel =
    | "infantil"
    | "fundamental"
    | "medio"
    | "superior"
    | "todas";

export type EducationLevelConfig = {
    id: EducationLevel;
    label: string;
    description: string;
    availableMetrics: string[];
};

export const EDUCATION_LEVELS: Record<EducationLevel, EducationLevelConfig> = {
    infantil: {
        id: "infantil",
        label: "Educação Infantil",
        description: "Creches e pré-escolas",
        availableMetrics: [
            "totalEscolas",
            "totalAlunos",
            "pctComInternet",
            "pctComBiblioteca",
            "pctComLabInformatica",
            "pctSemAcessibilidade"
        ],
    },
    fundamental: {
        id: "fundamental",
        label: "Ensino Fundamental",
        description: "Anos iniciais e finais",
        availableMetrics: [
            "totalEscolas",
            "totalAlunos",
            "pctComInternet",
            "pctComBiblioteca",
            "pctComLabInformatica",
            "pctSemAcessibilidade"
        ],
    },
    medio: {
        id: "medio",
        label: "Ensino Médio",
        description: "Ensino médio regular e técnico",
        availableMetrics: [
            "totalEscolas",
            "totalAlunos",
            "pctComInternet",
            "pctComBiblioteca",
            "pctComLabInformatica",
            "pctSemAcessibilidade"
        ],
    },
    superior: {
        id: "superior",
        label: "Ensino Superior",
        description: "Universidades e faculdades",
        availableMetrics: [
            "totalEscolas",
            "totalAlunos",
            "pctComInternet",
            "pctComBiblioteca",
            "pctComLabInformatica"
        ],
    },
    todas: {
        id: "todas",
        label: "Todas as etapas",
        description: "Visão geral de todos os níveis",
        availableMetrics: [
            "totalEscolas",
            "totalAlunos",
            "pctComInternet",
            "pctComBiblioteca",
            "pctComLabInformatica",
            "pctSemAcessibilidade"
        ],
    }
};
