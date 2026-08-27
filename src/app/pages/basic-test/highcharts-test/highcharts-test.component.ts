import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent as HighchartsChartComponent } from '@oneteme/jquery-highcharts';
import { ChartProvider, ChartType } from '@oneteme/jquery-core';

@Component({
  selector: 'app-highcharts-test',
  templateUrl: './highcharts-test.component.html',
  standalone: true,
  imports: [CommonModule, HighchartsChartComponent],
})
export class HighchartsChartPreviewComponent {
  @Input() chartType: ChartType = 'line';
  @Input() chartConfig: ChartProvider<string, number>;
  @Input() chartData: any[] = [];
  @Input() isLoadingChart: boolean = false;
  @Input() enablePivot: boolean = false;
  @Input() possibleTypes?: ChartType[];
  onCustomEvent(event: any): void {
    console.log('Custom event received:', event);
    // Ici vous pouvez gérer les événements de toolbar (previous, next, pivot, etc.)
  }
}
