"use client";

import React, { useState } from "react";
import type { EducationLevel } from "@/core/types/education";
import { EDUCATION_LEVELS } from "@/core/types/education";

type EducationLevelSelectorProps = {
  entityName: string;
  availableLevels: EducationLevel[];
  selectedLevel: EducationLevel;
  onLevelChange: (level: EducationLevel) => void;
  isDark: boolean;
};

export function EducationLevelSelector({
  availableLevels,
  selectedLevel,
  onLevelChange,
  isDark
}: EducationLevelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Se só tem 1 nível ou o único disponível é "todas", mostra label estático
  if (availableLevels.length === 0 || (availableLevels.length === 1 && availableLevels[0] === "todas")) {
    const label = availableLevels.length > 0
      ? EDUCATION_LEVELS[availableLevels[0]].label
      : EDUCATION_LEVELS["todas"].label;

    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>
          Nível:
        </span>
        <span className={`text-xs font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
          isDark
            ? "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        <span>📚</span>
        <span>{EDUCATION_LEVELS[selectedLevel].label}</span>
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-20 mt-1 w-48 overflow-hidden rounded-lg border shadow-lg ${
            isDark
              ? "border-zinc-700 bg-zinc-900"
              : "border-zinc-200 bg-white"
          }`}
        >
          {availableLevels.map((level) => {
            const config = EDUCATION_LEVELS[level];
            return (
              <button
                key={level}
                type="button"
                onClick={() => {
                  onLevelChange(level);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs transition ${
                  selectedLevel === level
                    ? isDark
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-cyan-50 text-cyan-700"
                    : isDark
                    ? "hover:bg-zinc-800 text-zinc-300"
                    : "hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                <div className="font-medium">{config.label}</div>
                <div className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                  {config.description}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}