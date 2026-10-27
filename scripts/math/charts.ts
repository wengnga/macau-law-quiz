/** Minimal SVG chart renderers. Every data point is labelled so answers can be read exactly. */

export interface Series {
  name: string;
  values: number[];
}

const WIDTH = 640;
const HEIGHT = 360;
const PAD = { top: 56, right: 20, bottom: 44, left: 44 };
const COLORS = ['#2563eb', '#f97316', '#16a34a', '#a855f7', '#e11d48'];
const FONT = "font-family=\"'PingFang TC','Microsoft JhengHei','Noto Sans CJK TC',sans-serif\"";

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function frame(title: string, body: string, legend: string[]): string {
  const legendItems = legend
    .map((name, i) => {
      const x = PAD.left + i * 130;
      return `<rect x="${x}" y="34" width="12" height="12" fill="${COLORS[i % COLORS.length]}"/><text x="${x + 18}" y="45" font-size="13" fill="#374151">${escape(name)}</text>`;
    })
    .join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" ${FONT}>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>`,
    `<text x="${WIDTH / 2}" y="22" font-size="15" font-weight="600" text-anchor="middle" fill="#111827">${escape(title)}</text>`,
    legendItems,
    body,
    '</svg>',
  ].join('');
}

/** Smallest 1/2/3/5 × 10ⁿ step ≥ raw, so the four gridlines land on round numbers. */
function niceStep(raw: number): number {
  const base = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  return ([1, 2, 3, 5, 10].find((m) => m * base >= raw) ?? 10) * base;
}

function axes(
  categories: string[],
  max: number,
  unit: string,
): {
  body: string;
  x: (i: number) => number;
  y: (v: number) => number;
  step: number;
} {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const step = plotW / categories.length;
  const top = niceStep((max * 1.15) / 4) * 4;
  const y = (v: number): number => PAD.top + plotH - (v / top) * plotH;
  const x = (i: number): number => PAD.left + step * i + step / 2;
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const v = top * f;
      return `<line x1="${PAD.left}" x2="${WIDTH - PAD.right}" y1="${y(v)}" y2="${y(v)}" stroke="#e5e7eb"/><text x="${PAD.left - 6}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="#6b7280">${v}</text>`;
    })
    .join('');
  const labels = categories
    .map((c, i) => `<text x="${x(i)}" y="${HEIGHT - PAD.bottom + 18}" font-size="12" text-anchor="middle" fill="#374151">${escape(c)}</text>`)
    .join('');
  const unitLabel = unit ? `<text x="${PAD.left - 6}" y="${PAD.top - 8}" font-size="11" text-anchor="end" fill="#6b7280">${escape(unit)}</text>` : '';
  return { body: grid + labels + unitLabel, x, y, step };
}

export function barChart(title: string, categories: string[], series: Series[], unit = ''): string {
  const max = Math.max(...series.flatMap((s) => s.values));
  const { body, x, y, step } = axes(categories, max, unit);
  const barW = Math.min(22, (step * 0.8) / series.length);
  const bars = series
    .map((s, si) =>
      s.values
        .map((v, i) => {
          const left = x(i) - (barW * series.length) / 2 + barW * si;
          const color = COLORS[si % COLORS.length];
          return `<rect x="${left}" y="${y(v)}" width="${barW - 2}" height="${y(0) - y(v)}" fill="${color}"/><text x="${left + (barW - 2) / 2}" y="${y(v) - 3}" font-size="10" text-anchor="middle" fill="#111827">${v}</text>`;
        })
        .join(''),
    )
    .join('');
  return frame(title, body + bars, series.length > 1 ? series.map((s) => s.name) : []);
}

export function lineChart(title: string, categories: string[], series: Series[], unit = ''): string {
  const max = Math.max(...series.flatMap((s) => s.values));
  const { body, x, y } = axes(categories, max, unit);
  const lines = series
    .map((s, si) => {
      const color = COLORS[si % COLORS.length];
      const points = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      const dots = s.values
        .map(
          (v, i) =>
            `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${color}"/><text x="${x(i)}" y="${y(v) - 8}" font-size="11" text-anchor="middle" fill="#111827">${v}</text>`,
        )
        .join('');
      return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5"/>${dots}`;
    })
    .join('');
  return frame(title, body + lines, series.length > 1 ? series.map((s) => s.name) : []);
}

/** `shares` are percentages summing to 100. */
export function pieChart(title: string, labels: string[], shares: number[]): string {
  const cx = 230;
  const cy = 200;
  const r = 120;
  let angle = -Math.PI / 2;
  const slices = shares
    .map((share, i) => {
      const sweep = (share / 100) * Math.PI * 2;
      const start = angle;
      angle += sweep;
      const large = sweep > Math.PI ? 1 : 0;
      const p = (a: number): string => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      const mid = start + sweep / 2;
      const color = COLORS[i % COLORS.length];
      const lx = cx + r * 0.65 * Math.cos(mid);
      const ly = cy + r * 0.65 * Math.sin(mid);
      return `<path d="M${cx},${cy} L${p(start)} A${r},${r} 0 ${large} 1 ${p(angle)} Z" fill="${color}" stroke="#fff" stroke-width="2"/><text x="${lx}" y="${ly + 4}" font-size="13" font-weight="600" text-anchor="middle" fill="#ffffff">${share}%</text>`;
    })
    .join('');
  const legend = labels
    .map(
      (label, i) =>
        `<rect x="400" y="${110 + i * 28}" width="14" height="14" fill="${COLORS[i % COLORS.length]}"/><text x="420" y="${122 + i * 28}" font-size="14" fill="#374151">${escape(label)}（${shares[i]}%）</text>`,
    )
    .join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" ${FONT}>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>`,
    `<text x="${WIDTH / 2}" y="26" font-size="15" font-weight="600" text-anchor="middle" fill="#111827">${escape(title)}</text>`,
    slices,
    legend,
    '</svg>',
  ].join('');
}

/** Markdown image with the SVG inlined, so the bank JSON stays self-contained and works offline. */
export function chartImage(svg: string, alt: string): string {
  return `![${alt}](data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')})`;
}
