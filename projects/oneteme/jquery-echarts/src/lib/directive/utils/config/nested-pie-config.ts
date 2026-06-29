import { buildChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

export const NESTED_PIE_TYPES: ChartType[] = ['nestedPie', 'nestedDonut'];

/** Palette ECharts par défaut (identique à celle utilisée automatiquement par ECharts). */
const ECHARTS_PALETTE = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666',
  '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc',
];

/**
 * Retourne une teinte plus claire d'une couleur hex.
 * @param hex   Couleur de base au format #rrggbb
 * @param factor 0 = couleur originale, 1 = blanc
 */
function tintColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const tr = Math.round(r + (255 - r) * factor);
  const tg = Math.round(g + (255 - g) * factor);
  const tb = Math.round(b + (255 - b) * factor);
  return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`;
}

function buildNestedPieOption(
  chart: CommonChart<string, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isDonut = type === 'nestedDonut';

  // ── Données anneau intérieur : un segment par série = somme totale de la série
  const innerData = chart.series.map((s, i) => {
    const color = s.color ?? ECHARTS_PALETTE[i % ECHARTS_PALETTE.length];
    const total = s.data.reduce<number>((sum, v) => sum + ((v as number) ?? 0), 0);
    return {
      name: s.name ?? `Série ${i + 1}`,
      value: total,
      itemStyle: { color },
    };
  });

  // ── Données anneau extérieur : un segment par catégorie × série
  //    Chaque segment utilise une teinte légèrement plus claire de la couleur de sa série
  //    pour que l'appartenance visuelle reste évidente.
  //    _seriesName est stocké pour permettre la synchronisation de la légende côté directive.
  const outerData = chart.series.flatMap((s, i) => {
    const baseColor = s.color ?? ECHARTS_PALETTE[i % ECHARTS_PALETTE.length];
    const seriesName = s.name ?? `Série ${i + 1}`;
    return s.data
      .map((val, j) => ({
        name: String(chart.categories[j] ?? ''),
        value: (val as number) ?? 0,
        itemStyle: { color: tintColor(baseColor, 0.3) },
        // Propriété custom pour synchroniser la légende (lue par la directive)
        _seriesName: seriesName,
      }))
      .filter((d) => d.value > 0);
  });

  // ── Rayons : le mode donut crée un trou central (inner = anneau)
  const innerRadius: [string | number, string] = isDonut ? ['12%', '35%'] : [0, '35%'];
  const outerRadius: [string, string] = ['48%', '70%'];

  // ── Légende : décalée si titre/sous-titre présent pour éviter les chevauchements
  const hasTitle = !!(config.title || config.subtitle);
  const hasSubtitle = !!config.subtitle;
  const legendTop = hasTitle ? (hasSubtitle ? 85 : 60) : 10;

  // ── Tooltip formatter : distingue anneau intérieur (total) et extérieur (détail)
  const tooltipFormatter = (params: any) => {
    const seriesIdx = params.seriesIndex as number;
    if (seriesIdx === 0) {
      // Anneau intérieur → total série
      return `<b>${params.name}</b><br/>Total : ${params.value} (${params.percent}%)`;
    }
    // Anneau extérieur → détail catégorie
    return `<b>${params.name}</b><br/>${params.value} (${params.percent}%)`;
  };

  return {
    legend: {
      show: true,
      type: 'scroll',
      orient: 'vertical',
      left: 'left',
      bottom: 0,
      top: legendTop,
      // La légende affiche uniquement les séries (anneau intérieur) pour rester lisible
      data: innerData.map((d) => d.name),
    },
    tooltip: {
      trigger: 'item',
      formatter: tooltipFormatter,
    },
    series: [
      {
        type: 'pie',
        name: 'Totaux',
        radius: innerRadius,
        center: ['55%', '50%'],
        data: innerData,
        label: {
          show: true,
          position: 'inner',
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          formatter: '{b}',
        },
        labelLine: { show: false },
        emphasis: { focus: 'self', scaleSize: 5 },
      },
      {
        type: 'pie',
        id: '__nested_outer__',
        name: 'Détail',
        radius: outerRadius,
        center: ['55%', '50%'],
        data: outerData,
        label: { show: false },
        labelLine: { show: false },
        emphasis: { focus: 'self', scaleSize: 3 },
      },
    ],
  };
}

export const nestedPieConfigurator: EChartTypeConfigurator = {
  supports: (type) => NESTED_PIE_TYPES.includes(type),

  buildChartData: (data, config) =>
    buildChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildNestedPieOption(chart as any, type, config),

  tooltipTrigger: 'item',
};
