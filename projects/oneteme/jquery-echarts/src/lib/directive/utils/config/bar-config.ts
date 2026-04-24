import { buildChart, ChartProvider, ChartType, CommonChart, XaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { getXAxisType } from '../chart-utils';
import { EChartTypeConfigurator } from './chart-config-registry';

function buildBarOption(
  chart: CommonChart<XaxisType, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const horizontal = type === 'bar';
  const categoryAxis = { type: 'category', data: chart.categories.map(String) };
  const valueAxis: any = { type: 'value' };

  return {
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: chart.series.map((s) => ({
      type: 'bar',
      name: s.name,
      data: s.data,
      stack: s.stack,
      itemStyle: s.color ? { color: s.color } : undefined,
      barMaxWidth: '60%',
    })),
  };
}

export const barConfigurator: EChartTypeConfigurator = {
  /**
   * Supporte bar, column et columnpyramid.
   * Note : `columnpyramid` est rendu comme un `bar` standard (ECharts ne dispose pas
   * de type pyramidal natif pour les barres cartésiennes ; un rendu via `pictorialBar`
   * serait nécessaire pour une forme pyramidale réelle).
   */
  supports: (type) => type === 'bar' || type === 'column' || type === 'columnpyramid',

  buildChartData: (data, config, type) =>
    buildChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildBarOption(chart as any, type, config),

  tooltipTrigger: 'axis',
};
