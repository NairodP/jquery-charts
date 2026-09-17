import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartComponent } from '@oneteme/jquery-echarts';
import { ECHARTS_EXAMPLES } from 'src/app/data/chart/echarts-examples.data';
import type { ChartType } from '@oneteme/jquery-core';
import { buildChartCode, highlightChartCode } from 'src/app/core/chart-code-snippet.util';
import { ECHARTS_SECTIONS } from '../charts/chart-example-sections';
import { ChartExampleNavigationService } from '../charts/chart-example-navigation.service';
import { trackVisibleChartExample } from '../charts/chart-example-tracker';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ChartComponent],
  selector: 'app-echarts',
  templateUrl: './echarts.component.html',
  styleUrls: ['./echarts.component.scss'],
})
export class EChartsComponent implements AfterViewInit, OnDestroy {

  readonly examples = ECHARTS_EXAMPLES;

  readonly sections = ECHARTS_SECTIONS;

  openCodeBlocks: Record<string, boolean> = {};
  activeCodeBlock: string | null = null;

  private stopExampleTracking: (() => void) | null = null;

  constructor(
    private readonly hostElement: ElementRef<HTMLElement>,
    private readonly chartNavigation: ChartExampleNavigationService,
  ) {}

  ngAfterViewInit(): void {
    this.chartNavigation.reset();
    this.stopExampleTracking = trackVisibleChartExample(
      this.hostElement.nativeElement,
      id => this.chartNavigation.setCurrentExample(id),
    );
  }

  ngOnDestroy(): void {
    this.stopExampleTracking?.();
  }

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
