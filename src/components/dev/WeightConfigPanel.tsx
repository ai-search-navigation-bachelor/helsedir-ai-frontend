/** Editable panel for configuring BM25/semantic/RRF/rerank weights and applying preset configurations. */
import type { WeightConfig } from "../../types/dev";
import { PRESETS } from "../../constants/dev";
import { SliderRow } from "./SliderRow";

interface RoleOption {
  slug: string;
  display_name: string;
}

interface WeightConfigPanelProps {
  label: string;
  config: WeightConfig;
  onChange: (config: WeightConfig) => void;
  roles?: RoleOption[];
}

export function WeightConfigPanel({
  label,
  config,
  onChange,
  roles,
}: WeightConfigPanelProps) {
  const idBase = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div
      style={{
        flex: 1,
        minWidth: "280px",
        padding: "20px",
        borderRadius: "10px",
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
      }}
    >
      <h3
        style={{
          fontSize: "0.85rem",
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: "18px",
          marginTop: 0,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </h3>

      {/* Linked BM25 / Semantic slider */}
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          <span style={{ color: "#0284c7" }}>
            BM25: {config.bm25_weight.toFixed(2)}
          </span>
          <span style={{ color: "#059669" }}>
            Semantisk: {config.semantic_weight.toFixed(2)}
          </span>
        </div>
        <style>{`
          input.dev-bm25-sem[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 6px;
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          }
          input.dev-bm25-sem[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid #047FA4;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          }
          input.dev-bm25-sem[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid #047FA4;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          }
          input.dev-bm25-sem[type="range"]::-moz-range-track {
            height: 6px;
            border-radius: 3px;
            border: none;
          }
        `}</style>
        <input
          className="dev-bm25-sem"
          id={`${idBase}-bm25-semantic`}
          type="range"
          aria-label="BM25 / Semantisk vektbalanse"
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
            background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${config.bm25_weight * 100}%, #059669 ${config.bm25_weight * 100}%, #059669 100%)`,
          }}
        />
      </div>

      {/* Boost inputs */}
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#475569",
              minWidth: "44px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Boost
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <BoostInput
              label="Temaside"
              value={config.temaside_boost}
              onChange={(v) => onChange({ ...config, temaside_boost: v })}
              ariaLabel="Temaside boost"
            />
            <BoostInput
              label="Retningslinje"
              value={config.retningslinje_boost}
              onChange={(v) => onChange({ ...config, retningslinje_boost: v })}
              ariaLabel="Retningslinje boost"
            />
          </div>
        </div>
      </div>

      {/* Role section */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#475569",
                minWidth: "44px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Rolle
            </span>
            <select
              aria-label={`Velg rolle for ${label}`}
              value={config.role ?? ""}
              onChange={(e) =>
                onChange({ ...config, role: e.target.value || null })
              }
              style={{
                flex: 1,
                maxWidth: "200px",
                padding: "5px 8px",
                fontSize: "0.82rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "#fff",
                color: "#1e293b",
                outline: "none",
                cursor: "pointer",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#047FA4";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            >
              <option value="">Alle</option>
              {roles?.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.display_name}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              paddingLeft: "54px",
              flexWrap: "wrap",
            }}
          >
            <BoostInput
              label="Rolle boost"
              value={config.role_boost}
              onChange={(v) => onChange({ ...config, role_boost: v })}
              ariaLabel={`Rolle boost for ${label}`}
            />
            <BoostInput
              label="Rolle straff"
              value={config.role_penalty}
              onChange={(v) => onChange({ ...config, role_penalty: v })}
              ariaLabel={`Rolle straff for ${label}`}
            />
          </div>
        </div>
      </div>

      <SliderRow
        id={`${idBase}-rrf`}
        label="RRF-k"
        value={config.rrf_k}
        min={1}
        max={200}
        step={1}
        onChange={(v) => onChange({ ...config, rrf_k: v })}
      />

      {/* Presets */}
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
              padding: "12px 28px",
              fontSize: "0.95rem",
              fontWeight: 600,
              borderRadius: "20px",
              border: "1px solid #bae6fd",
              backgroundColor: "#f0f9ff",
              color: "#0284c7",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e0f2fe";
              e.currentTarget.style.borderColor = "#7dd3fc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f9ff";
              e.currentTarget.style.borderColor = "#bae6fd";
            }}
          >
            {presetLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

interface BoostInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}

function BoostInput({ label, value, onChange, ariaLabel }: BoostInputProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "0.78rem", color: "#64748b", minWidth: "76px" }}>
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={3}
        step={0.05}
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isFinite(next)) return;
          onChange(Math.round(Math.min(3, Math.max(0, next)) * 100) / 100);
        }}
        style={{
          width: "68px",
          padding: "5px 8px",
          fontSize: "0.82rem",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          backgroundColor: "#fff",
          color: "#1e293b",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#047FA4";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#d1d5db";
        }}
        aria-label={ariaLabel}
      />
    </div>
  );
}
