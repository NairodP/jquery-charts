import { Component, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { APEXCHARTS_EXAMPLES } from 'src/app/data/chart/apexcharts-examples.data';
import { ChartType } from '@oneteme/jquery-core';
import { buildChartCode, highlightChartCode } from 'src/app/core/chart-code-snippet.util';

interface ApexSection {
  id: string;
  label: string;
  type: ChartType;
  exampleKey: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, ApexChartComponent],
  selector: 'app-apexcharts',
  templateUrl: './apexcharts.component.html',
  styleUrls: ['./apexcharts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApexChartsPageComponent {

  readonly examples = APEXCHARTS_EXAMPLES;

  readonly sections: ApexSection[] = [
    // Simple
    { id: 'pie',         label: 'Pie',               type: 'pie',         exampleKey: 'pieExample'        },
    { id: 'donut',       label: 'Donut',             type: 'donut',       exampleKey: 'donutExample'      },
    // Polar / Radar / Radial
    { id: 'polar',       label: 'Polar',             type: 'polar',       exampleKey: 'polarExample'      },
    { id: 'radar',       label: 'Radar',             type: 'radar',       exampleKey: 'radarExample'      },
    { id: 'radial',      label: 'Radial Bar',        type: 'radial',      exampleKey: 'radialExample'     },
    // Line / Area
    { id: 'line',        label: 'Line',              type: 'line',        exampleKey: 'lineExample'       },
    { id: 'area',        label: 'Area',              type: 'area',        exampleKey: 'areaExample'       },
    // Bar / Column
    { id: 'bar',         label: 'Bar (horizontal)',  type: 'bar',         exampleKey: 'barExample'        },
    { id: 'column',      label: 'Column (vertical)', type: 'column',      exampleKey: 'columnExample'     },
    // Heatmap / Treemap
    { id: 'heatmap',     label: 'Heatmap',           type: 'heatmap',     exampleKey: 'heatmapExample'    },
    { id: 'treemap',     label: 'Treemap',           type: 'treemap',     exampleKey: 'treemapExample'    },
    // Funnel / Pyramid
    { id: 'funnel',      label: 'Funnel',            type: 'funnel',      exampleKey: 'funnelExample'     },
    { id: 'pyramid',     label: 'Pyramid',           type: 'pyramid',     exampleKey: 'pyramidExample'    },
    // Range
    { id: 'rangeBar',    label: 'Range Bar (Gantt)', type: 'rangeBar',    exampleKey: 'rangeBarExample'   },
    { id: 'rangeColumn', label: 'Range Column',      type: 'rangeColumn', exampleKey: 'rangeColumnExample'},
    { id: 'rangeArea',   label: 'Range Area',        type: 'rangeArea',   exampleKey: 'rangeAreaExample'  },
  ];

  openCodeBlocks: Record<string, boolean> = {};
  activeCodeBlock: string | null = null;

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
    const example = (this.examples as any)[exampleKey];
    if (!example) return '';
    return highlightChartCode(buildChartCode(type, example));
  }
}
