import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartProvider, ChartType } from '@oneteme/jquery-core';

@Component({
  selector: 'app-apexcharts-chart-test',
  templateUrl: './apexcharts-chart-test.component.html',
  standalone: true,
  imports: [ CommonModule, ApexChartComponent ],
})
export class ApexChartPreviewComponent {
  @Input() chartType: ChartType = 'line';
  @Input() chartConfig: ChartProvider<string, number>;
  @Input() chartData: any[] = [];
}
