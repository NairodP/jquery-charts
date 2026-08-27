import { ORIGINAL_DATA_SYMBOL } from './memory-symbols';

export function isSimpleChartFormat(series: any[]): boolean {
  if (!series || series.length === 0) return false;

  if (series.length !== 1) return false;

  const firstSerie = series[0];
  if (!firstSerie.data || firstSerie.data.length === 0) return false;

  const firstPoint = firstSerie.data[0];
  if (typeof firstPoint === 'object') {
    return 'name' in firstPoint && ('y' in firstPoint || 'value' in firstPoint);
  }

  return false;
}

export function simpleToStandard(series: any[]): {
  series: any[];
  categories: string[];
} {
  if (!series || series.length === 0) {
    return { series: [], categories: [] };
  }

  const pieData = series[0]?.data || [];
  const categories: string[] = [];
  const standardData: any[] = [];

  pieData.forEach((point: any, index: number) => {
    const value =
      typeof point === 'object' ? point.y ?? point.value ?? 0 : point;
    const name =
      typeof point === 'object' ? point.name : `Catégorie ${index + 1}`;

    categories.push(name);
    standardData.push({
      x: index,
      y: value,
      name: name,
    });
  });

  return {
    series: [
      {
        name: series[0].name || 'Données',
        data: standardData,
        [ORIGINAL_DATA_SYMBOL]: series,
      },
    ],
    categories,
  };
}

export function standardToSimple(series: any[], categories?: string[]): any[] {
  if (!series || series.length === 0) return series;

  if (series.length === 1) {
    const serie = series[0];
    const simpleData = serie.data.map((point: any, index: number) => {
      const value =
        typeof point === 'object' ? point.y ?? point.value ?? 0 : point;
      const name =
        (typeof point === 'object' && point.name) ||
        (categories && categories[index]) ||
        `Catégorie ${index + 1}`;

      return {
        name,
        y: value,
      };
    });

    return [
      {
        name: serie.name || 'Données',
        data: simpleData,
        [ORIGINAL_DATA_SYMBOL]: series,
      },
    ];
  }

  const aggregated = series.map((serie) => {
    const sum = serie.data.reduce((total: number, point: any) => {
      const value =
        typeof point === 'object' ? point.y ?? point.value ?? 0 : point;
      return total + Math.abs(value);
    }, 0);

    return {
      name: serie.name || 'Série',
      y: sum,
    };
  });

  return [
    {
      name: 'Total par série',
      data: aggregated,
      [ORIGINAL_DATA_SYMBOL]: series,
    },
  ];
}
