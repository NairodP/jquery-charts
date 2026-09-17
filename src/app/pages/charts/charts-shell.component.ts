import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor } from '@angular/common';
import { Subscription } from 'rxjs';

interface LibraryTab {
  label: string;
  path: string;
  description: string;
  badge: string;
}

@Component({
  selector: 'app-charts-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor],
  templateUrl: './charts-shell.component.html',
  styleUrls: ['./charts-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsShellComponent implements OnInit, OnDestroy {
  readonly libraries: LibraryTab[] = [
    { label: 'ECharts',    path: '/charts/echarts',    description: 'Apache ECharts 5',  badge: 'echarts'    },
    { label: 'Highcharts', path: '/charts/highcharts', description: 'Highcharts 11',     badge: 'highcharts' },
    { label: 'ApexCharts', path: '/charts/apexcharts', description: 'ApexCharts 3',      badge: 'apexcharts' },
  ];

  private currentExampleType: string | null = null;
  private readonly routerSubscription = new Subscription();

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.updateCurrentExampleType();
    this.routerSubscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) this.updateCurrentExampleType();
      })
    );
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  libraryRoute(path: string): string[] {
    return this.currentExampleType ? [path, this.currentExampleType] : [path];
  }

  private updateCurrentExampleType(): void {
    const segments = this.router.url.split(/[?#]/, 1)[0].split('/').filter(Boolean);
    const nextType = segments[0] === 'charts' && segments.length >= 3 ? segments[2] : null;
    if (nextType === this.currentExampleType) return;
    this.currentExampleType = nextType;
    this.cdr.markForCheck();
  }
}
