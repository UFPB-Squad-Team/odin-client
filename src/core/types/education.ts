
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
    weightAdjustments: Record<string, number>;
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
        weightAdjustments: {
            "pctComInternet": 0.6,
            "pctComBiblioteca": 0.8,
            "pctComLabInformatica": 0.3,
            "totalEscolas": 1.2,
            "totalAlunos": 1.2
        }
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
        weightAdjustments: {
            "pctComInternet": 1.0,
            "pctComBiblioteca": 1.2,
            "pctComLabInformatica": 1.0,
            "totalEscolas": 1.0,
            "totalAlunos": 1.0
        }
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
        weightAdjustments: {
            "pctComInternet": 1.5,
            "pctComBiblioteca": 1.3,
            "pctComLabInformatica": 1.5,
            "totalEscolas": 0.8,
            "totalAlunos": 0.8
        }
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
        weightAdjustments: {
            "pctComInternet": 2.0,
            "pctComBiblioteca": 1.5,
            "pctComLabInformatica": 2.0,
            "totalEscolas": 0.5,
            "totalAlunos": 0.5
        }
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
        weightAdjustments: {}
    }
};
