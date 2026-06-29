import { buildSingleSerieChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

const PIE_TYPES: ChartType[] = ['pie', 'donut'];

function buildPieOption(
  chart: CommonChart<string, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isDonut = type === 'donut';

  // Aplatit toutes les séries en une liste {name, value}
  const data = chart.series.flatMap((s) =>
    s.data
      .map((val, i) => ({ name: String(chart.categories[i] ?? ''), value: val }))
      .filter((d) => d.value != null)
  );

  // Réserver de l'espace sous le titre pour éviter le chevauchement avec la légende.
  // ~60px pour un titre seul, ~85px si sous-titre présent, 10px sinon.
  const hasTitle = !!(config.title || config.subtitle);
  const hasSubtitle = !!config.subtitle;
  const legendTop = hasTitle ? (hasSubtitle ? 85 : 60) : 10;

  return {
    legend: {
      show: true,
      type: 'scroll',
      orient: 'vertical',
      left: 'left',
      bottom: 0,
      top: legendTop,
    },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        name: chart.series[0]?.name ?? '',
        radius: isDonut ? ['40%', '70%'] : '70%',
        center: ['50%', '50%'],
        data,
        // position:'center' DOIT être sur le label de base (pas seulement sur emphasis/select.label)
        // pour qu'ECharts positionne correctement au centre du donut lors du hover/select.
        label: isDonut ? { show: false, position: 'center' } : { show: false },
        labelLine: { show: false },
        labelLayout: { hideOverlap: true },
        ...(isDonut
          ? {
              selectedMode: 'single',
              emphasis: {
                itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
                label: {
                  show: true,
                  position: 'center',
                  formatter: '{d}%',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  padding: [4, 8],
                  borderRadius: 4
                }
              },
              select: {
                label: {
                  show: true,
                  position: 'center',
                  formatter: '{d}%',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  padding: [4, 8],
                  borderRadius: 4
                }
              }
            }
          : {
              emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } }
            }),
      },
      ...(isDonut
        ? [{
            type: 'pie' as const,
            name: chart.series[0]?.name ?? '',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data,
            silent: true,
            tooltip: { show: false },
            label: { show: false },
            labelLine: { show: false },
            labelLayout: { hideOverlap: true },
            emphasis: { disabled: true }
          }]
        : []),
    ],
  };
}

export const pieConfigurator: EChartTypeConfigurator = {
  supports: (type) => PIE_TYPES.includes(type),

  buildChartData: (data, config) =>
    buildSingleSerieChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildPieOption(chart as any, type, config),

  tooltipTrigger: 'item',
};
