import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePanelComponent, SliceConfig } from '@oneteme/jquery-table';
import { ChartProvider, field } from '@oneteme/jquery-core';
import { ChartComponent } from '@oneteme/jquery-highcharts';

interface Task {
  id: string;
  title: string;
  status: 'Backlog' | 'In Progress' | 'Done';
  owner: string;
  priority: 'Low' | 'Medium' | 'High';
}

interface OwnerStat {
  owner: string;
  done: number;
  inProgress: number;
  backlog: number;
}

@Component({
  selector: 'app-slice-chart',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePanelComponent, ChartComponent],
  templateUrl: './slice-chart.component.html',
  styleUrls: ['./slice-chart.component.scss'],
})
export class SliceChartComponent implements AfterViewInit {

  readonly tasks: Task[] = [
    { id: 'T-01', title: 'Refactoring auth',   status: 'Done',        owner: 'Amine',          priority: 'High'   },
    { id: 'T-02', title: 'Dashboard v2',        status: 'In Progress', owner: 'Fufu',           priority: 'High'   },
    { id: 'T-03', title: 'Fix pagination',      status: 'Done',        owner: 'Youssef Senior', priority: 'Medium' },
    { id: 'T-04', title: 'Write tests',         status: 'Backlog',     owner: 'Amine',          priority: 'Low'    },
    { id: 'T-05', title: 'Deploy staging',      status: 'In Progress', owner: 'Youssef',        priority: 'High'   },
    { id: 'T-06', title: 'API gateway',         status: 'Backlog',     owner: 'Youssef Senior', priority: 'Medium' },
    { id: 'T-07', title: 'UX review',           status: 'Done',        owner: 'Fufu',           priority: 'Low'    },
    { id: 'T-08', title: 'DB migration',        status: 'In Progress', owner: 'Amine',          priority: 'High'   },
    { id: 'T-09', title: 'Monitoring setup',    status: 'Backlog',     owner: 'Youssef',        priority: 'Medium' },
    { id: 'T-10', title: 'Doc API',             status: 'Done',        owner: 'Youssef Senior', priority: 'Low'    },
    { id: 'T-11', title: 'CI/CD pipeline',      status: 'In Progress', owner: 'Fufu',           priority: 'High'   },
    { id: 'T-12', title: 'Security audit',      status: 'Backlog',     owner: 'Youssef',        priority: 'High'   },
  ];

  readonly sliceConfigs: SliceConfig<Task>[] = [
    { title: 'Status',   columnKey: 'status'   },
    { title: 'Priorité', columnKey: 'priority' },
  ];

  // Config Highcharts — statique, définie une seule fois
  readonly chartConfig: ChartProvider<string, number> = {
    title: 'Tickets par développeur',
    stacked: true,
    series: [
      { data: { x: field('owner'), y: field('done') },       name: 'Done',        color: '#10b981' },
      { data: { x: field('owner'), y: field('inProgress') }, name: 'In Progress', color: '#f59e0b' },
      { data: { x: field('owner'), y: field('backlog') },      name: 'Backlog',    color: '#94a3b8' },
    ],
    options: { yAxis: { allowDecimals: false } } as any,
  };

  sliceCollapsed = false;

  chartData: OwnerStat[] = this.buildChartData(this.tasks);


  ngAfterViewInit(): void {
    setTimeout(() => { this.chartData = [...this.chartData]; });
  }

  onFilterChange(filterFn: (row: Task) => boolean): void {
    this.chartData = this.buildChartData(this.tasks.filter(filterFn));
  }

  private buildChartData(filtered: Task[]): OwnerStat[] {
    const owners = [...new Set(this.tasks.map(t => t.owner))].sort((a, b) => a.localeCompare(b));
    return owners.map(owner => {
      const ownerTasks = filtered.filter(t => t.owner === owner);
      return {
        owner,
        done:       ownerTasks.filter(t => t.status === 'Done').length,
        inProgress: ownerTasks.filter(t => t.status === 'In Progress').length,
        backlog:    ownerTasks.filter(t => t.status === 'Backlog').length,
      };
    });
  }

  readonly codeTs = `// my.component.ts
import { Component } from '@angular/core';
import { SliceConfig, SlicePanelComponent } from '@oneteme/jquery-table';
import { ChartProvider, field } from '@oneteme/jquery-core';
import { ChartComponent } from '@oneteme/jquery-highcharts';

interface Task {
  status: 'Backlog' | 'In Progress' | 'Done';
  owner: string;
  priority: 'Low' | 'Medium' | 'High';
}

interface OwnerStat { owner: string; done: number; inProgress: number; backlog: number; }

@Component({
  standalone: true,
  imports: [SlicePanelComponent, ChartComponent],
  templateUrl: './my.component.html',
  styleUrls: ['./my.component.scss'],
})
export class MyComponent implements AfterViewInit {

  readonly tasks: Task[] = [ /* ... vos données */ ];

  readonly sliceConfigs: SliceConfig<Task>[] = [
    { title: 'Status',   columnKey: 'status'   },
    { title: 'Priorité', columnKey: 'priority' },
  ];

  // Config Highcharts — statique, définie une seule fois
  readonly chartConfig: ChartProvider<string, number> = {
    title: 'Tickets par développeur',
    stacked: true,
    series: [
      { data: { x: field('owner'), y: field('done') },       name: 'Done',        color: '#10b981' },
      { data: { x: field('owner'), y: field('inProgress') }, name: 'In Progress', color: '#f59e0b' },
      { data: { x: field('owner'), y: field('backlog') },      name: 'Backlog',    color: '#94a3b8' },
    ],
    options: { yAxis: { allowDecimals: false } } as any,
  };

  sliceCollapsed = false;

  chartData: OwnerStat[] = this.buildChartData(this.tasks);

  onFilterChange(filterFn: (row: Task) => boolean): void {
    this.chartData = this.buildChartData(this.tasks.filter(filterFn));
  }

  private buildChartData(filtered: Task[]): OwnerStat[] {
    const owners = [...new Set(this.tasks.map(t => t.owner))];
    return owners.map(owner => {
      const ownerTasks = filtered.filter(t => t.owner === owner);
      return {
        owner,
        done:       ownerTasks.filter(t => t.status === 'Done').length,
        inProgress: ownerTasks.filter(t => t.status === 'In Progress').length,
        backlog:    ownerTasks.filter(t => t.status === 'Backlog').length,
      };
    });
  }
}`;

  readonly codeHtml = `<!-- my.component.html -->
<div class="layout">

  <slice-panel
    [sliceConfigs]="sliceConfigs"
    [data]="tasks"
    [showCounts]="false"
    [alwaysShow]="true"
    (filterChange)="onFilterChange($event)"
  ></slice-panel>

  <div class="chart-area">
    <chart type="bar"
      [config]="chartConfig"
      [data]="chartData"
    ></chart>
  </div>

</div>`;

  readonly codeScss = `/* my.component.scss */
:host {
  display: flex;
  flex-direction: column;
  height: 100%;         /* parent doit fournir une hauteur */
}

.layout {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

/* slice-panel a :host display:block => c'est un vrai flex-item */
slice-panel {
  flex: 0 0 200px;
  height: 100%;
  border-right: 1px solid #e2e8f0;
}

.chart-area {
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
}`;
}

