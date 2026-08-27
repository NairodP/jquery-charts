import { buildChart, ChartProvider, ChartType, CommonChart, CommonSerie, XaxisType, YaxisType, Coordinate2D } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { buildAxisTooltipFormatter, getXAxisType } from '../chart-utils';
import { EChartTypeConfigurator } from './chart-config-registry';

const DEFAULT_Y_AXIS_SPLIT_NUMBER = 5;
const MAX_Y_AXIS_COUNT = 2;

function extractUnitFromAxisTitle(title?: string): string | undefined {
  if (!title) {
    return undefined;
  }

  const match = /\(([^()]+)\)\s*$/.exec(title);
  return match?.[1]?.trim() || undefined;
}

function getAxisTitle(config: ChartProvider<any, any>, axisIndex: number): string | undefined {
  if (!config.ytitle) {
    return undefined;
  }

  return Array.isArray(config.ytitle) ? config.ytitle[axisIndex] : config.ytitle;
}

function extractTooltipValue(param: any): unknown {
  if (Array.isArray(param?.value)) {
    return param.value[1];
  }
  if (param?.value && typeof param.value === 'object' && 'value' in param.value) {
    return Array.isArray(param.value.value) ? param.value.value[1] : param.value.value;
  }
  return param?.value;
}

function mergeAxisConfig(configs: Record<string, any>[]): Record<string, any> {
  return configs.reduce((acc, current) => {
    const next = { ...acc, ...current };

    if (current.axisLabel) {
      next.axisLabel = { ...acc.axisLabel, ...current.axisLabel };
    }
    if (current.axisTick) {
      next.axisTick = { ...acc.axisTick, ...current.axisTick };
    }
    if (current.splitLine) {
      next.splitLine = { ...acc.splitLine, ...current.splitLine };
    }

    return next;
  }, {});
}

function getAxisPosition(order: number): { position: 'left' | 'right'; offset: number } {
  const sideIndex = Math.floor(order / 2);
  const isLeft = order % 2 === 0;

  return {
    position: isLeft ? 'left' : 'right',
    offset: sideIndex * 48,
  };
}

function isBarLikeSeriesType(type?: string): boolean {
  return type === 'bar' || type === 'column' || type === 'columnpyramid';
}

function resolveSeriesAxisIndexes(
  chart: CommonChart<XaxisType, YaxisType | Coordinate2D>,
  config: ChartProvider<any, any>
): number[] {
  const axisTitles = Array.isArray(config.ytitle) ? config.ytitle.filter(Boolean) : [];
  const requestedAxisCount = Math.max(axisTitles.length, 1);
  const axisCount = Math.min(requestedAxisCount, MAX_Y_AXIS_COUNT);
  const explicitIndexes = chart.series.map((s) => s.yAxisIndex);
  const hasExplicitIndex = explicitIndexes.some((value) => value !== undefined);

  if (hasExplicitIndex) {
    const indexes = chart.series.map((s) => s.yAxisIndex ?? 0);
    if (indexes.some((index) => !Number.isInteger(index) || index < 0 || index >= MAX_Y_AXIS_COUNT)) {
      throw new Error(
        `[jquery-echarts] Un graphique mixed accepte au maximum ${MAX_Y_AXIS_COUNT} axes Y. ` +
        'Utilisez uniquement yAxisIndex: 0 ou yAxisIndex: 1.'
      );
    }
    return indexes;
  }

  if (requestedAxisCount > MAX_Y_AXIS_COUNT) {
    console.warn(
      `[jquery-echarts] Un graphique mixed accepte au maximum ${MAX_Y_AXIS_COUNT} axes Y. ` +
      'Les axes supplémentaires sont ignorés.'
    );
  }

  if (axisCount <= 1) {
    return chart.series.map(() => 0);
  }

  if (chart.series.length <= axisCount) {
    return chart.series.map((_, index) => index);
  }

  if (axisCount === 2) {
    const hasBarLikeSeries = chart.series.some((s) => isBarLikeSeriesType(s.type));
    const hasNonBarLikeSeries = chart.series.some((s) => !isBarLikeSeriesType(s.type));

    if (hasBarLikeSeries && hasNonBarLikeSeries) {
      return chart.series.map((s) => (isBarLikeSeriesType(s.type) ? 0 : 1));
    }
  }

  console.warn(
    `⚠️  Configuration multi-axes ambiguë : ${chart.series.length} séries pour ${axisCount} axes Y sans yAxisIndex explicite. ` +
    `Le wrapper rattache par défaut toutes les séries au premier axe. Définissez yAxisIndex sur les séries pour lever l'ambiguïté.`
  );
  return chart.series.map(() => 0);
}

function resolveSeriesUnits(
  chart: CommonChart<XaxisType, YaxisType | Coordinate2D>,
  config: ChartProvider<any, any>,
  resolvedAxisIndexes: number[]
): Array<string | undefined> {
  const axisTitles = Array.isArray(config.ytitle)
    ? config.ytitle
    : [config.ytitle];

  return chart.series.map((series, index) => {
    if (series.unit) {
      return series.unit;
    }

    const axisTitle = axisTitles[resolvedAxisIndexes[index]];
    return extractUnitFromAxisTitle(axisTitle);
  });
}

function getCartesianSeriesData(
  series: CommonSerie<YaxisType | Coordinate2D>,
  chart: CommonChart<XaxisType, YaxisType | Coordinate2D>,
  xType: string,
  isContinue: boolean
): any {
  if (isContinue) {
    return (series.data as Coordinate2D[]).map((d) => {
      const src = (d as any)._o;
      if (src?._noData) {
        const noDataStyle = (series as any).noDataStyle ?? {};
        const color = noDataStyle.color ?? '#94a3b8';
        const symbolSize = noDataStyle.symbolSize ?? 5;
        const symbol = noDataStyle.symbol ?? 'circle';
        return {
          value: [d.x, d.y],
          _noData: true,
          symbol,
          symbolSize,
          itemStyle: { color, borderColor: color, opacity: noDataStyle.opacity ?? 0.85 },
        };
      }
      return [d.x, d.y];
    });
  }

  if (xType === 'category') {
    return series.data;
  }

  return (chart.categories ?? []).map((cat, index) => [cat, (series.data as any[])[index]]);
}

/**
 * Configurateur pour graphiques mixtes : supporte plusieurs types de séries
 * (ex: barres empilées + lignes) sur le même axe cartésien.
 * Support des dual/multi-axis Y via yAxisIndex sur chaque série.
 */
function buildMixedOption(
  chart: CommonChart<XaxisType, YaxisType | Coordinate2D>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isContinue = !!config.continue;
  const categories = chart.categories ?? [];
  const firstX = isContinue && chart.series[0]?.data[0]
    ? (chart.series[0].data[0] as Coordinate2D).x
    : undefined;
  const xType = getXAxisType(categories, isContinue, firstX);
  const resolvedAxisIndexes = resolveSeriesAxisIndexes(chart, config);
  const seriesUnits = resolveSeriesUnits(chart, config, resolvedAxisIndexes);

  // Séries masquées par défaut via visible: false
  const legendSelected: Record<string, boolean> = {};
  chart.series.forEach((s) => {
    if (s.visible === false && s.name) {
      legendSelected[s.name] = false;
    }
  });

  // ─── Détecte les yAxisIndex utilisés et crée les yAxis correspondants ───
  const yAxisIndexSet = new Set<number>();
  const yAxisConfigMap: Record<number, Record<string, any>[]> = {}; // Map axisIndex -> array de configs personnalisées
  
  chart.series.forEach((s, index) => {
    const axisIndex = resolvedAxisIndexes[index];
    yAxisIndexSet.add(axisIndex);

    if (s.yAxisConfig) {
      if (!yAxisConfigMap[axisIndex]) {
        yAxisConfigMap[axisIndex] = [];
      }
      yAxisConfigMap[axisIndex].push(s.yAxisConfig);
    }
  });

  // ─── Valide et fusionne les configurations pour chaque axe Y ───
  const yAxisFinalConfig: Record<number, Record<string, any>> = {};
  Object.entries(yAxisConfigMap).forEach(([axisIndex, configs]) => {
    const axisNum = Number.parseInt(axisIndex, 10);
    const mergedConfig = mergeAxisConfig(configs);
    
    const splitNumbers = configs.map((c) => c.splitNumber).filter((s) => s !== undefined);
    if (new Set(splitNumbers).size > 1) {
      console.warn(
        `⚠️  Conflit détecté sur l'axe Y ${axisNum} : plusieurs séries définissent des splitNumber différents (${Array.from(new Set(splitNumbers)).join(', ')}). ` +
        `Le dernier réglage sera utilisé. Assurez-vous que toutes les séries du même axe partagent la même configuration d'axe.`
      );
    }

    yAxisFinalConfig[axisNum] = mergedConfig;
  });

  const sortedAxisIndexes = Array.from(yAxisIndexSet).sort((a, b) => a - b);
  const maxAxisIndex = Math.min(Math.max(...sortedAxisIndexes, 0), MAX_Y_AXIS_COUNT - 1);
  const axisIndexes = Array.from({ length: maxAxisIndex + 1 }, (_, index) => index);
  const axisConfigs = axisIndexes.map((axisIndex) => yAxisFinalConfig[axisIndex] || {});
  const explicitSplitNumbers = axisConfigs
    .map((axisConfig) => axisConfig.splitNumber)
    .filter((value) => value !== undefined);
  const distinctSplitNumbers = Array.from(new Set(explicitSplitNumbers));
  const hasExplicitAlignTicksFalse = axisConfigs.some((axisConfig) => axisConfig.alignTicks === false);
  const shouldAlignTicksByDefault = axisIndexes.length > 1 && !hasExplicitAlignTicksFalse;
  const sharedSplitNumber = distinctSplitNumbers[0] ?? DEFAULT_Y_AXIS_SPLIT_NUMBER;

  const yAxisArray: any[] = [];
  axisIndexes.forEach((axisIndex, order) => {
    const customConfig = yAxisFinalConfig[axisIndex] || {};
    const axisLayout = getAxisPosition(order);
    const splitNum = shouldAlignTicksByDefault
      ? (customConfig.splitNumber ?? sharedSplitNumber)
      : customConfig.splitNumber;

    yAxisArray.push({
      ...customConfig,
      type: 'value',
      gridIndex: 0,
      position: axisLayout.position,
      offset: customConfig.offset ?? axisLayout.offset,
      name: getAxisTitle(config, axisIndex),
      ...(splitNum !== undefined ? { splitNumber: splitNum } : {}),
      scale: false,
      alignTicks: customConfig.alignTicks ?? shouldAlignTicksByDefault,
      axisLine: {
        onZero: false,
        ...(customConfig.axisLine ?? {}),
      },
    });
  });

  const series = chart.series.map((s, idx) => {
    // Determine serie type (default to global type or to 'bar'/'line' based on context)
    const serieType = s.type ?? type;
    const yAxisIndex = resolvedAxisIndexes[idx];

    // BAR / COLUMN series
    if (serieType === 'bar' || serieType === 'column' || serieType === 'columnpyramid') {
      return {
        type: 'bar',
        name: s.name,
        data: getCartesianSeriesData(s, chart, xType, isContinue) as any,
        stack: s.stack,
        yAxisIndex,
        itemStyle: s.color ? { color: s.color } : undefined,
        barMaxWidth: '60%',
      };
    }

    // LINE / SPLINE / AREA / AREASPLINE series (default)
    const isSmooth = serieType === 'spline' || serieType === 'areaspline';
    const hasArea = serieType === 'area' || serieType === 'areaspline';
    
    return {
      type: 'line',
      name: s.name,
      smooth: isSmooth,
      symbolSize: 0,
      areaStyle: hasArea ? {} : undefined,
      stack: s.stack,
      yAxisIndex,
      data: getCartesianSeriesData(s, chart, xType, isContinue) as any,
      itemStyle: s.color ? { color: s.color } : undefined,
      lineStyle: s.color ? { color: s.color } : undefined,
      z: hasArea ? 1 : 2,
    };
  });

  return {
    ...(Object.keys(legendSelected).length ? { legend: { selected: legendSelected } } : {}),
    ...((seriesUnits.some(Boolean) && !(config.options as any)?.tooltip?.formatter)
      ? {
          tooltip: {
            formatter: buildAxisTooltipFormatter((seriesIndex) => seriesUnits[seriesIndex]),
          },
        }
      : {}),
    xAxis: {
      type: xType as any,
      data: isContinue ? undefined : categories.map(String),
      boundaryGap: chart.series.some((s) => isBarLikeSeriesType(s.type ?? type)),
      gridIndex: 0,
    },
    yAxis: yAxisArray.length === 1 ? yAxisArray[0] : yAxisArray,
    series: series as any,
  };
}

export const mixedConfigurator: EChartTypeConfigurator = {
  supports: (type) => type === 'mixed',

  buildChartData: (data, config, type) =>
    buildChart(data, { ...config, continue: config.continue ?? false }),

  buildOption: (chart, type, config) => buildMixedOption(chart as any, type, config),

  tooltipTrigger: 'axis',
};
