import {
  CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatDate } from '../../lib/dates';
import { formatNumber } from '../../lib/series';
import type { Range } from '../../types';
import i18n from '../../i18n';

export interface ChartSeries {
  key: string;
  label: string;
  color: string; // variável CSS, ex.: var(--chart-1)
}

export interface ChartBand {
  range: Range;
  label: string;
}

interface Props {
  data: Record<string, number | string | undefined>[]; // cada linha tem `date` e uma chave por série
  series: ChartSeries[];
  unit: string;
  bands: ChartBand[]; // faixa verde geral de cada série
  baselines: { value: number; label: string }[];
  scaleLabels?: Record<string, string>;
}

interface TooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly { dataKey?: unknown; value?: unknown }[];
}

// Histórico de um indicador: linha do valor, faixa geral sombreada e linha de base tracejada.
export function IndicatorChart({ data, series, unit, bands, baselines, scaleLabels }: Props) {
  const format = (value: number) => scaleLabels?.[String(value)] ?? formatNumber(value);

  const renderTooltip = ({ active, label, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <div className="small muted">{formatDate(String(label))}</div>
        {series.map((s) => {
          const point = payload.find((p) => p.dataKey === s.key);
          if (typeof point?.value !== 'number') return null;
          return (
            <div key={s.key} className="row num">
              <span className="dot" style={{ background: s.color }} />
              {series.length > 1 && <span className="muted">{s.label}</span>}
              <strong>{format(point.value)}</strong> <span className="muted">{scaleLabels ? '' : unit}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="stack">
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            {bands.map((band) => (
              <ReferenceArea key={band.label} y1={band.range.min} y2={band.range.max} fill="var(--chart-band)" fillOpacity={1} stroke="none" ifOverflow="extendDomain" />
            ))}
            {baselines.map((b) => (
              <ReferenceLine key={b.label} y={b.value} stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} ifOverflow="extendDomain" />
            ))}
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => formatDate(d, true)}
              stroke="var(--text-faint)"
              tick={{ fill: 'var(--text-faint)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              minTickGap={24}
            />
            <YAxis
              stroke="var(--text-faint)"
              tick={{ fill: 'var(--text-faint)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={scaleLabels ? 84 : 44}
              domain={['auto', 'auto']}
              allowDecimals={!scaleLabels}
              tickFormatter={(v: number) => format(v)}
            />
            <Tooltip content={(props) => renderTooltip(props as TooltipProps)} cursor={{ stroke: 'var(--ring-strong)', strokeWidth: 1 }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.key}><span className="swatch" style={{ color: s.color }} />{s.label}</span>
        ))}
        {bands.length > 0 && <span><span className="swatch band" />{i18n.t('trends.generalRange')}</span>}
        {baselines.length > 0 && <span><span className="swatch dash" />{i18n.t('trends.personalPattern')}</span>}
      </div>
    </div>
  );
}
