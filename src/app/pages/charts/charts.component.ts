import { Component, HostListener, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  PIE_CHART_DATA,
  BAR_CHART_DATA,
  LINE_CHART_DATA,
  SPLINE_CHART_DATA,
  SCATTER_CHART_DATA,
  BUBBLE_CHART_DATA,
  TREEMAP_CHART_DATA,
  HEATMAP_CHART_DATA,
  RANGE_CHART_DATA,
  FUNNEL_CHART_DATA,
  COMBO_CHART_DATA,
  MAP_CHART_DATA,
  POLAR_CHART_DATA,
  RADAR_CHART_DATA,
  RADIAL_BAR_CHART_DATA,
} from '../../data/chart/_index';
import { ChartTypesService } from 'src/app/core/services/chart-types.service';
import { buildChartCode, highlightChartCode } from 'src/app/core/chart-code-snippet.util';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
})
export class ChartsComponent implements OnInit {
  selectedChartType: string = 'Pie Chart';
  private readonly chartTypeMap: { [key: string]: string } = {
    pie: 'Pie Chart',
    donut: 'Donut Chart',
    bar: 'Bar Chart',
    line: 'Line Chart',
    spline: 'Spline Chart',
    scatter: 'Scatter Chart',
    bubble: 'Bubble Chart',
    treemap: 'Treemap Chart',
    heatmap: 'Heatmap Chart',
    range: 'Range Chart',
    funnel: 'Funnel Chart',
    polar: 'Polar Chart',
    radar: 'Radar Chart',
    'radial-bar': 'Radial Bar Chart',
    combo: 'Combo Chart',
    map: 'Map Chart',
  };

  pieExample = PIE_CHART_DATA.pieExample;
  pieExample2 = PIE_CHART_DATA.pieExample2;
  pieExample3 = PIE_CHART_DATA.pieExample3;
  pieExample4 = PIE_CHART_DATA.pieExample4;
  pieExample5 = PIE_CHART_DATA.pieExample5;
  donutExample = PIE_CHART_DATA.donutExample;

  barExample = BAR_CHART_DATA.barExample;
  barExample2 = BAR_CHART_DATA.barExample2;
  barExample3 = BAR_CHART_DATA.barExample3;
  barExample4 = BAR_CHART_DATA.barExample4;
  barExample5 = BAR_CHART_DATA.barExample5;
  barExample6 = BAR_CHART_DATA.barExample6;
  barExample7 = BAR_CHART_DATA.barExample7;
  barExample8 = BAR_CHART_DATA.barExample8;
  barExample9 = BAR_CHART_DATA.barExample9;
  barExample10 = BAR_CHART_DATA.barExample10;

  lineExample = LINE_CHART_DATA.lineExample;
  lineExample2 = LINE_CHART_DATA.lineExample2;
  lineExample3 = LINE_CHART_DATA.lineExample3;
  lineExample4 = LINE_CHART_DATA.lineExample4;
  lineExample5 = LINE_CHART_DATA.lineExample5;
  lineExample6 = LINE_CHART_DATA.lineExample6;
  lineExample7 = LINE_CHART_DATA.lineExample7;
  lineExample8 = LINE_CHART_DATA.lineExample8;
  lineExample9 = LINE_CHART_DATA.lineExample9;

  splineExample = SPLINE_CHART_DATA.splineExample;
  splineExample2 = SPLINE_CHART_DATA.splineExample2;

  scatterExample = SCATTER_CHART_DATA.scatterExample;
  bubbleExample = BUBBLE_CHART_DATA.bubbleExample;

  treemapExample = TREEMAP_CHART_DATA.treemapExample;
  treemapExample2 = TREEMAP_CHART_DATA.treemapExample2;
  treemapExample3 = TREEMAP_CHART_DATA.treemapExample3;
  heatmapExample = HEATMAP_CHART_DATA.heatmapExample;
  rangeExample = RANGE_CHART_DATA.rangeExample;
  funnelExample = FUNNEL_CHART_DATA.funnelExample;

  comboExample = COMBO_CHART_DATA.comboExample;
  mapExample = MAP_CHART_DATA.mapExample;

  polarExample = POLAR_CHART_DATA.polarExample;
  radarExample = RADAR_CHART_DATA.radarExample;
  radialBarExample = RADIAL_BAR_CHART_DATA.radialBarExample;

  constructor(
    public router: Router,
    private readonly route: ActivatedRoute,
    private readonly chartTypesService: ChartTypesService
  ) {}

  ngOnInit() {
    this.chartTypesService.getSelectedType().subscribe((type) => {
      this.selectedChartType = type;
    });

    this.route.params.subscribe((params) => {
      const type = params['type'];
      if (type) {
        const fullType = this.chartTypeMap[type] || 'Pie Chart';
        this.chartTypesService.setSelectedType(fullType);
      }
    });
  }

  openCodeBlocks: { [key: string]: boolean } = {};
  activeCodeBlock: number | null = null;

  @HostListener('document:click', ['$event'])
  clickOutside(event: any) {
    const clickedElement = event.target as HTMLElement;
    if (
      !clickedElement.closest('.code-block') &&
      !clickedElement.closest('.code-toggle')
    ) {
      this.closeAllCodeBlocks();
    }
  }

  closeAllCodeBlocks() {
    this.openCodeBlocks = {};
    this.activeCodeBlock = null;
  }

  toggleCode(index: number, event: Event) {
    event.stopPropagation();

    if (this.activeCodeBlock !== null && this.activeCodeBlock !== index) {
      this.openCodeBlocks[this.activeCodeBlock] = false;
    }

    this.openCodeBlocks[index] = !this.openCodeBlocks[index];
    this.activeCodeBlock = this.openCodeBlocks[index] ? index : null;
  }

  isCodeOpen(index: number): boolean {
    return this.openCodeBlocks[index] || false;
  }

  getHighlightedCode(example: any): string {
    if (!example) return '';

    let chartType = 'pie';
    if (example === PIE_CHART_DATA.donutExample) {
      chartType = 'donut';
    } else if (Object.values(BAR_CHART_DATA).includes(example)) {
      chartType = 'bar';
    } else if (Object.values(LINE_CHART_DATA).includes(example)) {
      chartType = 'line';
    } else if (Object.values(SPLINE_CHART_DATA).includes(example)) {
      chartType = 'spline';
    } else if (Object.values(SCATTER_CHART_DATA).includes(example)) {
      chartType = 'scatter';
    } else if (Object.values(BUBBLE_CHART_DATA).includes(example)) {
      chartType = 'bubble';
    } else if (Object.values(TREEMAP_CHART_DATA).includes(example)) {
      chartType = 'treemap';
    } else if (Object.values(HEATMAP_CHART_DATA).includes(example)) {
      chartType = 'heatmap';
    } else if (Object.values(RANGE_CHART_DATA).includes(example)) {
      chartType = 'arearange';
    } else if (Object.values(FUNNEL_CHART_DATA).includes(example)) {
      chartType = 'funnel';
    } else if (Object.values(COMBO_CHART_DATA).includes(example)) {
      chartType = 'line';
    } else if (Object.values(MAP_CHART_DATA).includes(example)) {
      chartType = 'map';
    } else if (Object.values(POLAR_CHART_DATA).includes(example)) {
      chartType = 'polar';
    } else if (Object.values(RADAR_CHART_DATA).includes(example)) {
      chartType = 'radar';
    } else if (Object.values(RADIAL_BAR_CHART_DATA).includes(example)) {
      chartType = 'radialBar';
    }

    return highlightChartCode(buildChartCode(chartType, example));
  }
}
