import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {ChartComponent} from '@oneteme/jquery-echarts';
import {ChartProvider} from '@oneteme/jquery-core';

@Component({
  selector: 'app-dashboard-chart-tooltip-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ChartComponent],
  template: `
    <h2 mat-dialog-title>Controle du tooltip ECharts</h2>
    <div mat-dialog-content class="tooltip-dialog__content">
      <p>Survolez les colonnes : le tooltip doit rester au-dessus du graphique, dans cette modale.</p>
      <div class="tooltip-dialog__chart">
        <chart type="column" [config]="chartConfig" [data]="chartData" renderer="canvas"></chart>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Fermer</button>
    </div>
  `,
  styles: [`
    .tooltip-dialog__content { min-width: min(76vw, 720px); }
    .tooltip-dialog__content p { margin: 0 0 16px; color: #526b73; }
    .tooltip-dialog__chart { height: 360px; }
    @media (max-width: 760px) {
      .tooltip-dialog__content { min-width: 0; }
      .tooltip-dialog__chart { height: 300px; }
    }
  `]
})
export class DashboardChartTooltipDialogComponent {
  readonly chartConfig: ChartProvider<string, number> = {
    xtitle: 'Periode',
    ytitle: 'MWh',
    series: [{
      name: 'Consommation en modale',
      type: 'column',
      color: '#176b72',
      data: {xField: 'period', yField: 'usage'}
    }]
  };

  readonly chartData = [
    {period: 'Jan.', usage: 112},
    {period: 'Fev.', usage: 136},
    {period: 'Mars', usage: 128},
    {period: 'Avr.', usage: 161}
  ];

  constructor(readonly dialogRef: MatDialogRef<DashboardChartTooltipDialogComponent>) {}
}
