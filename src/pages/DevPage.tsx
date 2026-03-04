import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Button,
  Heading,
  Paragraph,
  Spinner,
} from "@digdir/designsystemet-react";
import { search, searchKeyword } from "../api/search";
import type { SearchResponse, SearchResult } from "../types";
import { ds, colors } from "../styles/dsTokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeightConfig {
  bm25_weight: number;
  semantic_weight: number;
  rrf_k: number;
  temaside_boost: number;
  retningslinje_boost: number;
}

interface SlotState {
  config: WeightConfig;
  response: SearchResponse | null;
  loading: boolean;
  error: string | null;
}

interface ResultStats {
  total: number;
  avgScoreTop10: number;
  minScore: number;
  maxScore: number;
  categoryCounts: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: WeightConfig = {
  bm25_weight: 0.3,
  semantic_weight: 0.7,
  rrf_k: 60,
  temaside_boost: 1.15,
  retningslinje_boost: 1.1,
};

// Fixed reference config simulating Helsedir-style keyword search:
// pure BM25 (no semantic), title weighted over body, temaside/retningslinje prioritised
const HELSEDIR_STYLE_CONFIG: WeightConfig = {
  bm25_weight: 1.0,
  semantic_weight: 0.0,
  rrf_k: 0,
  temaside_boost: 1.0,
  retningslinje_boost: 1.0,
};

const PRESETS: Array<{ label: string; config: WeightConfig }> = [
  {
    label: "Vår løsning",
    config: {
      bm25_weight: 0.3,
      semantic_weight: 0.7,
      rrf_k: 60,
      temaside_boost: 1.15,
      retningslinje_boost: 1.1,
    },
  },
  {
    label: "Balansert",
    config: {
      bm25_weight: 0.5,
      semantic_weight: 0.5,
      rrf_k: 60,
      temaside_boost: 1.15,
      retningslinje_boost: 1.1,
    },
  },
  {
    label: "Kun semantisk",
    config: {
      bm25_weight: 0.0,
      semantic_weight: 1.0,
      rrf_k: 60,
      temaside_boost: 1.15,
      retningslinje_boost: 1.1,
    },
  },
  {
    label: "Kun BM25",
    config: {
      bm25_weight: 1.0,
      semantic_weight: 0.0,
      rrf_k: 60,
      temaside_boost: 1.15,
      retningslinje_boost: 1.1,
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeStats(response: SearchResponse): ResultStats {
  const results = response.results;
  const top10 = results.slice(0, 10);
  const avgScoreTop10 =
    top10.length === 0
      ? 0
      : top10.reduce((sum, r) => sum + r.score, 0) / top10.length;

  const scores = results.map((r) => r.score);
  return {
    total: response.total,
    avgScoreTop10: Math.round(avgScoreTop10 * 10000) / 10000,
    minScore: scores.length
      ? Math.round(Math.min(...scores) * 10000) / 10000
      : 0,
    maxScore: scores.length
      ? Math.round(Math.max(...scores) * 10000) / 10000
      : 0,
    categoryCounts: response.category_counts,
  };
}

function computeRankMap(results: SearchResult[]): Map<string, number> {
  const map = new Map<string, number>();
  results.forEach((r, i) => map.set(r.id, i + 1));
  return map;
}

function getRankDiff(
  id: string,
  rankMapA: Map<string, number>,
  rankMapB: Map<string, number>,
): number | null {
  const rankA = rankMapA.get(id);
  const rankB = rankMapB.get(id);
  if (rankA === undefined || rankB === undefined) return null;
  return rankA - rankB;
}

function parseExplanation(explanation?: string): {
  bm25?: number;
  semantic?: number;
} {
  if (!explanation) return {};
  const bm25Match = explanation.match(/BM25=(\d+\.?\d*)/);
  const semanticMatch = explanation.match(/Semantic=(\d+\.?\d*)/);
  return {
    bm25: bm25Match ? parseFloat(bm25Match[1]) : undefined,
    semantic: semanticMatch ? parseFloat(semanticMatch[1]) : undefined,
  };
}

function formatInfoTypeLabel(infoType: string): string {
  const normalized = infoType.toLowerCase();
  const map: Record<string, string> = {
    "lov-eller-forskriftstekst-med-kommentar": "Lov/forskrift m. kommentar",
    "regelverk-lov-eller-forskrift": "Regelverk",
    "nasjonal-faglig-retningslinje": "Retningslinje",
    "nasjonalt-forlop": "Nasjonalt forløp",
  };
  if (map[normalized]) return map[normalized];
  return infoType
    .split("-")
    .map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: SliderRowProps) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <label
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: disabled ? colors.textSubtle : colors.text,
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: disabled
              ? colors.textSubtle
              : ds.color("logobla-1", "text-default"),
            minWidth: "44px",
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: disabled
            ? colors.borderSubtle
            : ds.color("logobla-2", "base-default"),
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
}
function ReadOnlyConfigPanel({
  label,
  sublabel,
  config,
  rowLabels,
}: {
  label: string;
  sublabel: string;
  config: WeightConfig;
  rowLabels?: { bm25?: string; semantic?: string; rrf?: string };
}) {
  const noop = () => {
    /* read-only */
  };
  return (
    <div
      style={{
        flex: 1,
        minWidth: "280px",
        padding: "20px",
        border: `1px dashed ${colors.border}`,
        borderRadius: "12px",
        backgroundColor: colors.surface,
      }}
    >
      <Heading level={3} data-size="xs" style={{ marginBottom: "4px" }}>
        {label}
      </Heading>
      <p
        style={{
          fontSize: "0.75rem",
          color: colors.textSubtle,
          marginBottom: "16px",
          marginTop: 0,
        }}
      >
        {sublabel}
      </p>
      <SliderRow
        label={rowLabels?.bm25 ?? "BM25-vekt"}
        value={config.bm25_weight}
        min={0}
        max={1}
        step={0.05}
        onChange={noop}
        disabled
      />
      <SliderRow
        label={rowLabels?.semantic ?? "Semantisk vekt"}
        value={config.semantic_weight}
        min={0}
        max={1}
        step={0.05}
        onChange={noop}
        disabled
      />
      <SliderRow
        label={rowLabels?.rrf ?? "RRF-k"}
        value={config.rrf_k}
        min={config.rrf_k === 0 ? 0 : 1}
        max={200}
        step={1}
        onChange={noop}
        disabled
      />
    </div>
  );
}

interface WeightConfigPanelProps {
  label: string;
  config: WeightConfig;
  onChange: (config: WeightConfig) => void;
}


function WeightConfigPanel({
  label,
  config,
  onChange,
}: WeightConfigPanelProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "280px",
        padding: "20px",
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        backgroundColor: colors.surface,
      }}
    >
      <Heading level={3} data-size="xs" style={{ marginBottom: "18px" }}>
        {label}
      </Heading>

      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: colors.text,
          }}
        >
          <span>BM25: {config.bm25_weight.toFixed(2)}</span>
          <span>Semantisk: {config.semantic_weight.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.bm25_weight}
          onChange={(e) => {
            const rounded = Math.round(Number(e.target.value) * 20) / 20;
            onChange({
              ...config,
              bm25_weight: rounded,
              semantic_weight: Math.round((1 - rounded) * 20) / 20,
            });
          }}
          style={{
            width: "100%",
            accentColor: ds.color("logobla-2", "base-default"),
            cursor: "pointer",
          }}
        />
      </div>
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: colors.text,
              minWidth: "44px",
            }}
          >
            Boost
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.82rem", color: colors.textSubtle, minWidth: "76px" }}>
                Temaside
              </span>
              <input
                type="number"
                min={0}
                max={3}
                step={0.05}
                inputMode="decimal"
                value={config.temaside_boost}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (!Number.isFinite(next)) return;
                  onChange({ ...config, temaside_boost: Math.round(Math.min(3, Math.max(0, next)) * 100) / 100 });
                }}
                style={{
                  width: "72px",
                  padding: "5px 8px",
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
                aria-label="Temaside boost"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.82rem", color: colors.textSubtle, minWidth: "76px" }}>
                Retningslinje
              </span>
              <input
                type="number"
                min={0}
                max={3}
                step={0.05}
                inputMode="decimal"
                value={config.retningslinje_boost}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (!Number.isFinite(next)) return;
                  onChange({ ...config, retningslinje_boost: Math.round(Math.min(3, Math.max(0, next)) * 100) / 100 });
                }}
                style={{
                  width: "72px",
                  padding: "5px 8px",
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
                aria-label="Retningslinje boost"
              />
            </div>
          </div>
        </div>
      </div>
      <SliderRow
        label="RRF-k"
        value={config.rrf_k}
        min={1}
        max={200}
        step={1}
        onChange={(v) => onChange({ ...config, rrf_k: v })}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginTop: "16px",
        }}
      >
        {PRESETS.map(({ label: presetLabel, config: preset }) => (
          <button
            key={presetLabel}
            type="button"
            onClick={() => onChange(preset)}
            style={{
              padding: "4px 12px",
              fontSize: "0.78rem",
              borderRadius: "20px",
              border: `1px solid ${colors.border}`,
              backgroundColor: "white",
              cursor: "pointer",
              color: colors.text,
            }}
          >
            {presetLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "0.875rem",
  color: colors.text,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "0.875rem",
  color: colors.text,
};

interface StatsBarProps {
  statsA: ResultStats;
  statsB: ResultStats;
  statsC: ResultStats | null;
}

function StatsBar({ statsA, statsB, statsC }: StatsBarProps) {
  const c = statsC;
  const rows: Array<{
    label: string;
    a: string | number;
    b: string | number;
    c: string | number;
  }> = [
    {
      label: "Totale treff",
      a: statsA.total,
      b: statsB.total,
      c: c?.total ?? "—",
    },
    {
      label: "Gj.sn. score (topp 10)",
      a: statsA.avgScoreTop10,
      b: statsB.avgScoreTop10,
      c: c?.avgScoreTop10 ?? "—",
    },
    {
      label: "Høyeste score",
      a: statsA.maxScore,
      b: statsB.maxScore,
      c: c?.maxScore ?? "—",
    },
    {
      label: "Laveste score",
      a: statsA.minScore,
      b: statsB.minScore,
      c: c?.minScore ?? "—",
    },
  ];

  return (
    <div
      style={{
        marginBottom: "24px",
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: colors.surfaceTinted }}>
            <th style={thStyle}>Statistikk</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Konfig A</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Konfig B</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Helsedir</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
            >
              <td style={tdStyle}>{row.label}</td>
              <td
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.a}
              </td>
              <td
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.b}
              </td>
              <td
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                  color: colors.textSubtle,
                }}
              >
                {row.c}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreLegend({ mode }: { mode: "hybrid" | "keyword" }) {
  const dot = (color: string) => (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
  const row = (color: string, label: string, desc: string) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
      {dot(color)}
      <span style={{ fontWeight: 600, color: colors.text }}>{label}</span>
      <span>— {desc}</span>
    </div>
  );
  return (
    <div
      style={{
        marginTop: "8px",
        padding: "7px 10px",
        borderRadius: "6px",
        border: `1px solid ${colors.borderSubtle}`,
        backgroundColor: "white",
        fontSize: "0.70rem",
        color: colors.textSubtle,
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}
    >
      {mode === "hybrid" ? (
        <>
          {row("#3b82f6", "BM25×w", "ordbasert score × BM25-vekt")}
          {row("#10b981", "Sem.×w", "semantisk score × semantisk vekt")}
          {row(ds.color("logobla-1", "text-default"), "RRF-norm", "endelig RRF-score normalisert til 1 (topp-treff = 1.0)")}
        </>
      ) : (
        <>
          {row(ds.color("logobla-1", "text-default"), "Final", "endelig score fra keyword-søk (tittelbasert)")}
        </>
      )}
    </div>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const BLOCKS = 10;
  const filled = Math.round(Math.min(Math.max(value, 0), 1) * BLOCKS);
  const bar = "█".repeat(filled) + "░".repeat(BLOCKS - filled);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.72rem",
        fontFamily: "monospace",
      }}
    >
      <span style={{ minWidth: "44px", color: colors.textSubtle }}>
        {label}
      </span>
      <span style={{ color, letterSpacing: "1px" }}>{bar}</span>
      <span
        style={{ color: colors.textSubtle, fontVariantNumeric: "tabular-nums" }}
      >
        {value.toFixed(2)}
      </span>
    </div>
  );
}

interface DevResultItemProps {
  rank: number;
  result: SearchResult;
  rankDiff: number | null;
  config?: WeightConfig;
  scoringMode?: "hybrid" | "keyword";
  maxScore?: number;
}

function DevResultItem({
  rank,
  result,
  rankDiff,
  config,
  scoringMode = "hybrid",
  maxScore,
}: DevResultItemProps) {
  const diffColor =
    rankDiff === null
      ? undefined
      : rankDiff > 0
        ? { bg: "#dcfce7", text: "#166534" }
        : rankDiff < 0
          ? { bg: "#fee2e2", text: "#991b1b" }
          : { bg: "#f1f5f9", text: "#475569" };
  const infoTypeLabel = formatInfoTypeLabel(result.info_type);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 12px",
        borderBottom: `1px solid ${colors.borderSubtle}`,
        fontSize: "0.875rem",
      }}
    >
      <span
        style={{
          minWidth: "24px",
          fontWeight: 700,
          color: colors.textSubtle,
          paddingTop: "2px",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {rank}
      </span>

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "3px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "1px 8px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: ds.color("logobla-1", "text-default"),
              backgroundColor: "#e8f4f8",
              maxWidth: "250px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={result.info_type}
          >
            {infoTypeLabel}
          </span>

          {rankDiff !== null && rankDiff !== 0 && diffColor && (
            <span
              style={{
                display: "inline-block",
                padding: "1px 7px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: diffColor.bg,
                color: diffColor.text,
              }}
            >
              {rankDiff > 0 ? `+${rankDiff}` : String(rankDiff)}
            </span>
          )}
        </div>

        <div style={{ fontWeight: 500, color: colors.text, lineHeight: 1.4 }}>
          {result.title}
        </div>

        {result.explanation && (
          <div
            style={{
              fontSize: "0.68rem",
              color: colors.textSubtle,
              fontFamily: "monospace",
              marginTop: "3px",
            }}
          >
            {result.explanation}
          </div>
        )}

        {(() => {
          const parsed = parseExplanation(result.explanation);
          const bm25 = result.bm25_score ?? parsed.bm25;
          const semantic = result.semantic_score ?? parsed.semantic;
          const hasComponents = bm25 !== undefined || semantic !== undefined;
          const weightedBm25 =
            bm25 !== undefined && config ? bm25 * config.bm25_weight : bm25;
          const weightedSemantic =
            semantic !== undefined && config
              ? semantic * config.semantic_weight
              : semantic;

          return hasComponents || scoringMode === "keyword" ? (
            <div
              style={{
                marginTop: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              {config && (
                <div
                  style={{
                    fontSize: "0.66rem",
                    color: colors.textSubtle,
                    fontFamily: "monospace",
                    marginBottom: "2px",
                  }}
                >
                  BM25 {bm25?.toFixed(2) ?? "—"} ×{" "}
                  {config.bm25_weight.toFixed(2)} ={" "}
                  {weightedBm25?.toFixed(2) ?? "—"} | Sem.{" "}
                  {semantic?.toFixed(2) ?? "—"} ×{" "}
                  {config.semantic_weight.toFixed(2)} ={" "}
                  {weightedSemantic?.toFixed(2) ?? "—"}
                </div>
              )}
              {bm25 !== undefined && (
                <ScoreBar
                  label={config ? "BM25×w" : "BM25"}
                  value={weightedBm25 ?? bm25}
                  color="#3b82f6"
                />
              )}
              {semantic !== undefined && (
                <ScoreBar
                  label={config ? "Sem.×w" : "Sem."}
                  value={weightedSemantic ?? semantic}
                  color="#10b981"
                />
              )}
              {maxScore != null && maxScore > 0 && (
                <ScoreBar
                  label="RRF-norm"
                  value={result.score / maxScore}
                  color={ds.color("logobla-1", "text-default")}
                />
              )}
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

interface CategoryBreakdownTableProps {
  countsA: Record<string, number>;
  countsB: Record<string, number>;
  countsC: Record<string, number>;
}

function CategoryBreakdownTable({
  countsA,
  countsB,
  countsC,
}: CategoryBreakdownTableProps) {
  const allKeys = Array.from(
    new Set([
      ...Object.keys(countsA),
      ...Object.keys(countsB),
      ...Object.keys(countsC),
    ]),
  ).sort();

  if (allKeys.length === 0) return null;

  return (
    <div style={{ marginTop: "28px" }}>
      <Heading level={3} data-size="xs" style={{ marginBottom: "12px" }}>
        Kategorifordeling
      </Heading>
      <div
        style={{
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: colors.surfaceTinted }}>
              <th style={thStyle}>Kategori</th>
              <th style={{ ...thStyle, textAlign: "center" }}>A</th>
              <th style={{ ...thStyle, textAlign: "center" }}>B</th>
              <th style={{ ...thStyle, textAlign: "center" }}>C</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Delta B-A</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Delta C-A</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => {
              const a = countsA[key] ?? 0;
              const b = countsB[key] ?? 0;
              const c = countsC[key] ?? 0;
              const deltaBA = b - a;
              const deltaCA = c - a;
              return (
                <tr
                  key={key}
                  style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
                >
                  <td style={tdStyle}>{key}</td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {a}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {b}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                      color: colors.textSubtle,
                    }}
                  >
                    {c}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: deltaBA !== 0 ? 600 : 400,
                      color:
                        deltaBA > 0
                          ? "#166534"
                          : deltaBA < 0
                            ? "#991b1b"
                            : colors.textSubtle,
                    }}
                  >
                    {deltaBA > 0
                      ? `+${deltaBA}`
                      : deltaBA === 0
                        ? "—"
                        : String(deltaBA)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: deltaCA !== 0 ? 600 : 400,
                      color:
                        deltaCA > 0
                          ? "#166534"
                          : deltaCA < 0
                            ? "#991b1b"
                            : colors.textSubtle,
                    }}
                  >
                    {deltaCA > 0
                      ? `+${deltaCA}`
                      : deltaCA === 0
                        ? "—"
                        : String(deltaCA)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function DevPage() {
  const [query, setQuery] = useState("");
  const [slotA, setSlotA] = useState<SlotState>({
    config: { ...DEFAULT_CONFIG },
    response: null,
    loading: false,
    error: null,
  });
  const [slotB, setSlotB] = useState<SlotState>({
    config: { ...DEFAULT_CONFIG },
    response: null,
    loading: false,
    error: null,
  });
  const [slotHelsedir, setSlotHelsedir] = useState<SlotState>({
    config: { ...HELSEDIR_STYLE_CONFIG },
    response: null,
    loading: false,
    error: null,
  });

  const abortRef = useRef<{
    a?: AbortController;
    b?: AbortController;
    h?: AbortController;
  }>({});

  useEffect(() => {
    return () => {
      abortRef.current.a?.abort();
      abortRef.current.b?.abort();
      abortRef.current.h?.abort();
    };
  }, []);

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    abortRef.current.a?.abort();
    abortRef.current.b?.abort();
    abortRef.current.h?.abort();

    const controllerA = new AbortController();
    const controllerB = new AbortController();
    const controllerH = new AbortController();
    abortRef.current = { a: controllerA, b: controllerB, h: controllerH };

    setSlotA((s) => ({ ...s, loading: true, error: null }));
    setSlotB((s) => ({ ...s, loading: true, error: null }));
    setSlotHelsedir((s) => ({ ...s, loading: true, error: null }));

    const [resultA, resultB, resultH] = await Promise.allSettled([
      search(trimmed, {
        signal: controllerA.signal,
        limit: 20,
        log: false,
        method: "hybrid",
        ...slotA.config,
      }),
      search(trimmed, {
        signal: controllerB.signal,
        limit: 20,
        log: false,
        method: "hybrid",
        ...slotB.config,
      }),
      searchKeyword(trimmed, { signal: controllerH.signal, limit: 20 }),
    ]);

    if (resultA.status === "fulfilled") {
      setSlotA((s) => ({ ...s, loading: false, response: resultA.value }));
    } else if ((resultA.reason as Error)?.name !== "AbortError") {
      setSlotA((s) => ({
        ...s,
        loading: false,
        error: "Søk A feilet. Sjekk konsollen for detaljer.",
      }));
    }

    if (resultB.status === "fulfilled") {
      setSlotB((s) => ({ ...s, loading: false, response: resultB.value }));
    } else if ((resultB.reason as Error)?.name !== "AbortError") {
      setSlotB((s) => ({
        ...s,
        loading: false,
        error: "Søk B feilet. Sjekk konsollen for detaljer.",
      }));
    }

    if (resultH.status === "fulfilled") {
      setSlotHelsedir((s) => ({
        ...s,
        loading: false,
        response: resultH.value,
      }));
    } else if ((resultH.reason as Error)?.name !== "AbortError") {
      setSlotHelsedir((s) => ({
        ...s,
        loading: false,
        error: "Helsedir-søk feilet. Sjekk konsollen for detaljer.",
      }));
    }
  }

  const isLoading = slotA.loading || slotB.loading || slotHelsedir.loading;
  const hasResults =
    slotA.response !== null ||
    slotB.response !== null ||
    slotHelsedir.response !== null;
  const statsA = slotA.response ? computeStats(slotA.response) : null;
  const statsB = slotB.response ? computeStats(slotB.response) : null;
  const statsHelsedir = slotHelsedir.response
    ? computeStats(slotHelsedir.response)
    : null;
  const rankMapA = slotA.response
    ? computeRankMap(slotA.response.results)
    : new Map<string, number>();
  const rankMapB = slotB.response
    ? computeRankMap(slotB.response.results)
    : new Map<string, number>();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 lg:px-12">
      <Heading level={1} data-size="md" style={{ marginBottom: "6px" }}>
        Utviklerverktøy – Søkevekting
      </Heading>
      <Paragraph
        data-size="sm"
        style={{ marginBottom: "20px", color: colors.textSubtle }}
      >
        Verktøy for å evaluere og sammenligne søkekonfigurasjoner i
        Helsedirektoratets søkesystem. Søkeresultatene vises side om side
        slik at man kan vurdere hvilke innstillinger som gir best treffkvalitet.
      </Paragraph>

      <div
        style={{
          marginBottom: "20px",
          padding: "14px 16px",
          borderRadius: "8px",
          border: `1px solid ${colors.borderSubtle}`,
          backgroundColor: colors.surfaceTinted,
        }}
      >
        <Paragraph data-size="xs" style={{ margin: 0, marginBottom: "8px", color: colors.text, fontWeight: 600 }}>
          Om søkeparameterne
        </Paragraph>
        <Paragraph data-size="xs" style={{ margin: 0, color: colors.textSubtle, lineHeight: 1.6 }}>
          <strong style={{ color: colors.text }}>BM25</strong> er ordbasert søk som bruker invers dokumentfrekvens (IDF) — sjeldne ord som forekommer i få dokumenter vektes høyere enn vanlige ord, slik at unike og betydningsfulle søkeord får større påvirkning på rangeringen.{" "}
          <strong style={{ color: colors.text }}>Semantisk</strong> søk forstår betydningen av spørsmålet og finner relatert innhold selv uten ordlikhet, ved hjelp av vektorrepresentasjoner.{" "}
          Vektene for BM25 og Semantisk summerer alltid til 1.0 og styrer hvor mye hver metode bidrar til rangeringen.{" "}
          <strong style={{ color: colors.text }}>RRF-k</strong> (Reciprocal Rank Fusion) bestemmer hvordan resultatlistene fra BM25 og semantisk søk slås sammen — høyere verdi gir jevnere vekting mellom listene, lavere verdi løfter topp-treffene sterkere.{" "}
          <strong style={{ color: colors.text }}>Boost</strong> multipliserer scoren til utvalgte innholdstyper (temasider og retningslinjer) for å prioritere dem i rangeringen — 1.0 er nøytral, verdier over 1.0 løfter innholdstypen opp.
        </Paragraph>
      </div>

      {/* Search input */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          id="dev-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runSearch();
          }}
          placeholder="Skriv inn søkeord og trykk Enter..."
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: "1rem",
            borderRadius: "8px",
            border: `1.5px solid ${colors.border}`,
            outline: "none",
            boxSizing: "border-box",
            color: colors.text,
          }}
        />
        <Button
          variant="primary"
          onClick={() => void runSearch()}
          disabled={!query.trim() || isLoading}
          style={{ whiteSpace: "nowrap" }}
        >
          {isLoading ? "Søker..." : "Sammenlign søk"}
        </Button>
      </div>

      {/* Config panels */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <WeightConfigPanel
          label="Konfig A"
          config={slotA.config}
          onChange={(cfg) => setSlotA((s) => ({ ...s, config: cfg }))}
        />
        <WeightConfigPanel
          label="Konfig B"
          config={slotB.config}
          onChange={(cfg) => setSlotB((s) => ({ ...s, config: cfg }))}
        />
        <ReadOnlyConfigPanel
          label="Konfig C — Helsedir-stil"
          sublabel="Fast referanse — keyword-søk (method=keyword)"
          config={HELSEDIR_STYLE_CONFIG}
          rowLabels={{
            bm25: "Keyword search vekt",
            rrf: "RRF-k (ikke brukt)",
          }}
        />
      </div>

      {/* Errors */}
      {slotA.error && (
        <Alert data-color="danger" style={{ marginBottom: "12px" }}>
          <Paragraph>{slotA.error}</Paragraph>
        </Alert>
      )}
      {slotB.error && (
        <Alert data-color="danger" style={{ marginBottom: "12px" }}>
          <Paragraph>{slotB.error}</Paragraph>
        </Alert>
      )}
      {slotHelsedir.error && (
        <Alert data-color="danger" style={{ marginBottom: "12px" }}>
          <Paragraph>{slotHelsedir.error}</Paragraph>
        </Alert>
      )}

      {/* Loading spinners (before first result) */}
      {isLoading && !hasResults && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "48px 0",
          }}
        >
          <Spinner aria-label="Laster søkeresultater" data-size="lg" />
        </div>
      )}

      {/* Results */}
      {hasResults && statsA && statsB && (
        <>
          <StatsBar statsA={statsA} statsB={statsB} statsC={statsHelsedir} />

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {/* Config A results */}
            <div
              style={{
                flex: 1,
                minWidth: "280px",
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: colors.surfaceTinted,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <Heading level={3} data-size="xs">
                  Konfig A — {slotA.response?.total ?? 0} treff
                </Heading>
                <Paragraph
                  data-size="xs"
                  style={{ color: colors.textSubtle, marginTop: "2px" }}
                >
                  BM25: {slotA.config.bm25_weight.toFixed(2)} · Semantisk:{" "}
                  {slotA.config.semantic_weight.toFixed(2)} · RRF-k:{" "}
                  {slotA.config.rrf_k}
                </Paragraph>
                <Paragraph
                  data-size="xs"
                  style={{ color: colors.textSubtle, marginTop: "0px" }}
                >
                  Temaside-boost: {slotA.config.temaside_boost.toFixed(2)} ·
                  Retningslinje-boost:{" "}
                  {slotA.config.retningslinje_boost.toFixed(2)}
                </Paragraph>
                <ScoreLegend mode="hybrid" />
              </div>
              {slotA.loading ? (
                <div
                  style={{
                    padding: "32px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Spinner aria-label="Laster konfig A" />
                </div>
              ) : (
                (slotA.response?.results ?? []).map((r, i) => (
                  <DevResultItem
                    key={r.id}
                    rank={i + 1}
                    result={r}
                    rankDiff={null}
                    config={slotA.config}
                    scoringMode="hybrid"
                    maxScore={slotA.response!.results[0]?.score}
                  />
                ))
              )}
            </div>

            {/* Config B results */}
            <div
              style={{
                flex: 1,
                minWidth: "280px",
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: colors.surfaceTinted,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <Heading level={3} data-size="xs">
                  Konfig B — {slotB.response?.total ?? 0} treff
                </Heading>
                <Paragraph
                  data-size="xs"
                  style={{ color: colors.textSubtle, marginTop: "2px" }}
                >
                  BM25: {slotB.config.bm25_weight.toFixed(2)} · Semantisk:{" "}
                  {slotB.config.semantic_weight.toFixed(2)} · RRF-k:{" "}
                  {slotB.config.rrf_k}
                </Paragraph>
                <Paragraph
                  data-size="xs"
                  style={{ color: colors.textSubtle, marginTop: "0px" }}
                >
                  Temaside-boost: {slotB.config.temaside_boost.toFixed(2)} ·
                  Retningslinje-boost:{" "}
                  {slotB.config.retningslinje_boost.toFixed(2)}
                </Paragraph>
                <ScoreLegend mode="hybrid" />
              </div>
              {slotB.loading ? (
                <div
                  style={{
                    padding: "32px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Spinner aria-label="Laster konfig B" />
                </div>
              ) : (
                (slotB.response?.results ?? []).map((r, i) => (
                  <DevResultItem
                    key={r.id}
                    rank={i + 1}
                    result={r}
                    rankDiff={getRankDiff(r.id, rankMapA, rankMapB)}
                    config={slotB.config}
                    scoringMode="hybrid"
                    maxScore={slotB.response!.results[0]?.score}
                  />
                ))
              )}
            </div>

            {/* Helsedir-style results */}
            <div
              style={{
                flex: 1,
                minWidth: "280px",
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: colors.surfaceTinted,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <Heading level={3} data-size="xs">
                  Keyword-søk — {slotHelsedir.response?.total ?? 0} treff
                </Heading>
                <Paragraph
                  data-size="xs"
                  style={{ color: colors.textSubtle, marginTop: "2px" }}
                >
                  Keyword-søk · tittelbasert matching · RRF brukes ikke
                </Paragraph>
                <ScoreLegend mode="keyword" />
              </div>
              {slotHelsedir.loading ? (
                <div
                  style={{
                    padding: "32px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Spinner aria-label="Laster keyword-søk resultater" />
                </div>
              ) : (
                (slotHelsedir.response?.results ?? []).map((r, i) => (
                  <DevResultItem
                    key={r.id}
                    rank={i + 1}
                    result={r}
                    rankDiff={null}
                    scoringMode="keyword"
                    maxScore={slotHelsedir.response!.results[0]?.score}
                  />
                ))
              )}
            </div>
          </div>

          <CategoryBreakdownTable
            countsA={statsA.categoryCounts}
            countsB={statsB.categoryCounts}
            countsC={statsHelsedir?.categoryCounts ?? {}}
          />
        </>
      )}

      {/* Placeholder before first search */}
      {!hasResults && !isLoading && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: colors.textSubtle,
            border: `1px dashed ${colors.borderSubtle}`,
            borderRadius: "12px",
          }}
        >
          <Paragraph data-size="md">
            Skriv inn et søkeord og trykk «Sammenlign søk» for å starte.
          </Paragraph>
        </div>
      )}
    </div>
  );
}
