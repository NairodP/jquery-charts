import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartClickEvent, ChartComponent, ChartDrilldownConfig } from '@oneteme/jquery-echarts';
import { ECHARTS_EXAMPLES } from 'src/app/data/chart/echarts-examples.data';
import { ChartType } from '@oneteme/jquery-core';
import { buildChartCode, highlightChartCode } from 'src/app/core/chart-code-snippet.util';

interface EChartsSection {
  id: string;
  label: string;
  type: ChartType;
  exampleKey: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ChartComponent],
  selector: 'app-echarts',
  templateUrl: './echarts.component.html',
  styleUrls: ['./echarts.component.scss'],
})
export class EChartsComponent implements OnInit {

  readonly examples = ECHARTS_EXAMPLES;

  readonly drilldownConfig: any = {
    xtitle: 'Période',
    ytitle: 'Valeur',
    series: [
      { name: 'Ventes', data: { x: (row: any) => row.period, y: (row: any) => row.sales }, color: '#1b6ca8' },
      { name: 'Commandes', data: { x: (row: any) => row.period, y: (row: any) => row.orders }, color: '#d97732' },
    ],
  };
  drilldownNavigation: ChartDrilldownConfig = {
    levels: [{ id: 'months', label: 'Mois' }, { id: 'days', label: 'Jours' }],
    activeLevel: 'months',
  };
  drilldownRows = [
    { period: 'Janvier', sales: 120, orders: 18 }, { period: 'Février', sales: 168, orders: 24 },
    { period: 'Mars', sales: 142, orders: 21 }, { period: 'Avril', sales: 214, orders: 31 },
  ];
  drilldownLoading = false;
  private readonly drilldownCache = new Map<string, any[]>();
  private drilldownRequest = 0;

  readonly drilldownCode = `import { ChartClickEvent, ChartDrilldownConfig } from '@oneteme/jquery-echarts';
import { ChartProvider, field } from '@oneteme/jquery-core';

interface Row { period: string; sales: number; orders: number; }

// Les données initiales restent en mémoire pour le retour sans requête.
const monthlyRows: Row[] = [
  { period: 'Janvier', sales: 120, orders: 18 },
  { period: 'Février', sales: 168, orders: 24 },
  { period: 'Mars', sales: 142, orders: 21 },
  { period: 'Avril', sales: 214, orders: 31 },
];

readonly config: ChartProvider<string, number> = {
  xtitle: 'Période',
  ytitle: 'Valeur',
  series: [
    { name: 'Ventes', data: { x: field('period'), y: field('sales') }, color: '#1b6ca8' },
    { name: 'Commandes', data: { x: field('period'), y: field('orders') }, color: '#d97732' },
  ],
};

rows = monthlyRows;
loading = false;
drilldown: ChartDrilldownConfig = {
  levels: [{ id: 'months', label: 'Mois' }, { id: 'days', label: 'Jours' }],
  activeLevel: 'months',
};
private readonly cache = new Map<string, Row[]>();

onChartClick(event: ChartClickEvent): void {
  if (event.dataIndex === undefined || this.drilldown.activeLevel !== 'months') return;
  const month = typeof event.name === 'string' ? event.name : null;
  if (!month) return;
  this.loading = true;
  const request = this.cache.get(month) ?? this.fetchMonthDetails(month);
  request.then(rows => {
    this.cache.set(month, rows);
    this.rows = rows;
    this.drilldown = { ...this.drilldown, activeLevel: 'days' };
  }).finally(() => this.loading = false);
}

onDrilldownNavigate(level: string): void {
  if (level !== 'months') return;
  this.rows = monthlyRows; // aucune requête pour revenir au niveau initial
  this.drilldown = { ...this.drilldown, activeLevel: 'months' };
}

private fetchMonthDetails(month: string): Promise<Row[]> {
  // Remplacer cette fonction par this.http.get<Row[]>(...).
  return new Promise(resolve => setTimeout(() => resolve([
    { period: month + ' 01', sales: 42, orders: 6 },
    { period: month + ' 02', sales: 51, orders: 8 },
    { period: month + ' 03', sales: 38, orders: 5 },
  ]), 2000));
}

// Template
<chart type="line" [config]="config" [data]="rows"
  [isLoading]="loading" [drilldown]="drilldown"
  (chartClick)="onChartClick($event)"
  (drilldownNavigate)="onDrilldownNavigate($event)"></chart>`;

  onDrilldownClick(event: ChartClickEvent): void {
    if (event.dataIndex === undefined || this.drilldownNavigation.activeLevel !== 'months') return;
    const month = typeof event.name === 'string' ? event.name : null;
    if (!month) return;
    this.drilldownLoading = true;
    const requestId = ++this.drilldownRequest;
    const cached = this.drilldownCache.get(month);
    (cached ? Promise.resolve(cached) : this.fetchMonthDetails(month)).then(rows => {
      if (requestId !== this.drilldownRequest) return;
      this.drilldownCache.set(month, rows);
      this.drilldownRows = rows;
      this.drilldownNavigation = { ...this.drilldownNavigation, activeLevel: 'days' };
    }).finally(() => {
      if (requestId === this.drilldownRequest) this.drilldownLoading = false;
    });
  }

  onDrilldownNavigate(levelId: string): void {
    if (levelId !== 'months') return;
    this.drilldownRequest++;
    this.drilldownLoading = false;
    this.drilldownRows = [
      { period: 'Janvier', sales: 120, orders: 18 }, { period: 'Février', sales: 168, orders: 24 },
      { period: 'Mars', sales: 142, orders: 21 }, { period: 'Avril', sales: 214, orders: 31 },
    ];
    this.drilldownNavigation = { ...this.drilldownNavigation, activeLevel: 'months' };
  }

  private fetchMonthDetails(month: string): Promise<any[]> {
    const source = this.drilldownRows.find(row => row.period === month) ?? { sales: 100, orders: 10 };
    return new Promise(resolve => window.setTimeout(() => resolve(Array.from({ length: 7 }, (_, index) => ({
      period: `${month.slice(0, 3)} ${index + 1}`,
      sales: Math.round(source.sales * (0.7 + index / 20)),
      orders: Math.round(source.orders * (0.8 + index / 25)),
    }))), 2000));
  }

  readonly sections: EChartsSection[] = [
    { id: 'bar', label: 'Bar (horizontal)', type: 'bar', exampleKey: 'barExample' },
    { id: 'column', label: 'Column (vertical)', type: 'column', exampleKey: 'columnExample' },
    { id: 'line', label: 'Line', type: 'line', exampleKey: 'lineExample' },
    { id: 'spline', label: 'Spline', type: 'spline', exampleKey: 'splineExample' },
    { id: 'area', label: 'Area', type: 'area', exampleKey: 'areaExample' },
    { id: 'pie', label: 'Pie', type: 'pie', exampleKey: 'pieExample' },
    { id: 'donut', label: 'Donut', type: 'donut', exampleKey: 'donutExample' },
    { id: 'scatter', label: 'Scatter', type: 'scatter', exampleKey: 'scatterExample' },
    { id: 'bubble', label: 'Bubble', type: 'bubble', exampleKey: 'bubbleExample' },
    { id: 'heatmap', label: 'Heatmap', type: 'heatmap', exampleKey: 'heatmapExample' },
    { id: 'treemap', label: 'Treemap', type: 'treemap', exampleKey: 'treemapExample' },
    { id: 'funnel', label: 'Funnel', type: 'funnel', exampleKey: 'funnelExample' },
    { id: 'pyramid', label: 'Pyramid', type: 'pyramid', exampleKey: 'pyramidExample' },
    { id: 'radar', label: 'Radar', type: 'radar', exampleKey: 'radarExample' },
    { id: 'rangeBar', label: 'Range Bar (Gantt)', type: 'rangeBar', exampleKey: 'rangeBarExample' },
    { id: 'rangeColumn', label: 'Range Column', type: 'rangeColumn', exampleKey: 'rangeColumnExample' },
    { id: 'multiSeries', label: 'Multi-Series (Bar+Line)', type: 'mixed', exampleKey: 'multiSeriesExample' },
    { id: 'dualAxis', label: 'Dual Axis (Different Units)', type: 'mixed', exampleKey: 'dualAxisExample' },
    { id: 'customAxis', label: 'Custom Y Axes', type: 'mixed', exampleKey: 'customAxisExample' },
    { id: 'mixedCategory', label: 'Stacked Columns + Target', type: 'mixed', exampleKey: 'mixedCategoryExample' },
    { id: 'pivotRows', label: 'Pivot Rows (Core)', type: 'mixed', exampleKey: 'pivotRowsExample' },
  ];

  openCodeBlocks: Record<string, boolean> = {};
  activeCodeBlock: string | null = null;

  ngOnInit(): void {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.code-block') && !target.closest('.code-toggle')) {
      this.openCodeBlocks = {};
      this.activeCodeBlock = null;
    }
  }

  toggleCode(id: string, event: Event): void {
    event.stopPropagation();
    if (this.activeCodeBlock && this.activeCodeBlock !== id) {
      this.openCodeBlocks[this.activeCodeBlock] = false;
    }
    this.openCodeBlocks[id] = !this.openCodeBlocks[id];
    this.activeCodeBlock = this.openCodeBlocks[id] ? id : null;
  }

  isCodeOpen(id: string): boolean {
    return this.openCodeBlocks[id] ?? false;
  }

  getHighlightedCode(type: ChartType, exampleKey: string): string {
    const example = this.examples[exampleKey];
    if (!example) return '';
    if (example.code) return this._highlightCode(example.code);
    return highlightChartCode(buildChartCode(type, example));
  }

  _highlightCode(code: string): string {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped
      .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
      .replace(/\b(const|let|var|function|return)\b/g, '<span class="keyword">$1</span>')
      .replace(/('[^']*')/g, '<span class="string">$1</span>')
      .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(/&lt;(echarts-chart|chart)/g, '<span class="tag">&lt;$1</span>')
      .replace(/&lt;\/(echarts-chart|chart)&gt;/g, '<span class="tag">&lt;/$1&gt;</span>')
      .replace(/(type|config|data)=/g, '<span class="attr">$1</span>=')
      .replace(/\b(field|rangeFields|values|joinFields)\b/g, '<span class="fn">$1</span>');
  }
}
