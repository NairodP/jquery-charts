import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { APEXCHARTS_SECTIONS, ECHARTS_DETAIL_SECTIONS, HIGHCHARTS_SECTIONS } from 'src/app/pages/charts/chart-example-sections';

interface ChartTypeItem { id: string; label: string; }
interface LibItem { key: string; label: string; route: string; types: ChartTypeItem[]; }

@Component({
  selector: 'app-sidebar',
  template: `
    <button class="menu-toggle" (click)="toggleMenu()" [class.active]="isMenuOpen" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>

    <div class="sidebar" [class.open]="isMenuOpen">

      <div class="sidebar-section">
        <span class="sidebar-section-label">Composants</span>
        <ul>
          <li [class.active]="isTableRoute()" (click)="goToTable()">jquery-table</li>
          <li [class.active]="isOrganizerRoute()" (click)="goToOrganizer()">jquery-organizer</li>
        </ul>
      </div>

      <div class="sidebar-section">
        <span class="sidebar-section-label">Graphiques</span>
        <ul>
          <li *ngFor="let lib of libs" [class.active]="isChartsLib(lib.key)">
            <span class="lib-name" (click)="goToLib(lib)">{{ lib.label }}</span>
            <span class="lib-arrow" [class.open]="isExpanded(lib.key)" (click)="toggleExpand(lib, $event)">›</span>
            <ul class="sub-list" *ngIf="isExpanded(lib.key)" (click)="$event.stopPropagation()">
              <li
                *ngFor="let type of lib.types; trackBy: trackByFn"
                [class.active]="isActiveType(lib, type)"
                (click)="goToType(lib, type, $event)"
              >{{ type.label }}</li>
            </ul>
          </li>
        </ul>
      </div>

      <div class="sidebar-section">
        <span class="sidebar-section-label">API</span>
        <ul>
          <li [class.active]="isCoreApiRoute()" (click)="goToCoreApi()">jquery-core</li>
          <li [class.active]="isOrganizerApiRoute()" (click)="goToOrganizerApi()">jquery-organizer</li>
          <li [class.active]="isHighchartsApiRoute()" (click)="goToHighchartsApi()">jquery-highcharts</li>
          <li [class.active]="isApiRoute()" (click)="goToApi()">jquery-echarts</li>
          <li [class.active]="isApexchartsApiRoute()" (click)="goToApexchartsApi()">jquery-apexcharts</li>
          <li [class.active]="isTableApiRoute()" (click)="goToTableApi()">jquery-table</li>
        </ul>
      </div>

    </div>

    <div class="overlay" *ngIf="isMenuOpen" (click)="toggleMenu()"></div>
  `,
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  isMenuOpen = false;
  expandedLibs = new Set<string>();

  readonly libs: LibItem[] = [
    {
      key: 'echarts', label: 'jquery-echarts', route: '/charts/echarts',
      types: ECHARTS_DETAIL_SECTIONS.map(({ id, label }) => ({ id, label }))
    },
    {
      key: 'highcharts', label: 'jquery-highcharts', route: '/charts/highcharts',
      types: HIGHCHARTS_SECTIONS.map(({ id, label }) => ({ id, label }))
    },
    {
      key: 'apexcharts', label: 'jquery-apexcharts', route: '/charts/apexcharts',
      types: APEXCHARTS_SECTIONS.map(({ id, label }) => ({ id, label }))
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Init : expand lib active au démarrage
    this.libs.forEach(lib => { if (this.isChartsLib(lib.key)) this.expandedLibs.add(lib.key); });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      // Auto-expand la lib active (sans replier les autres)
      this.libs.forEach(lib => { if (this.isChartsLib(lib.key)) this.expandedLibs.add(lib.key); });
      this.cdr.markForCheck();
    });
  }

  trackByFn(_index: number, item: ChartTypeItem): string { return item.id; }

  isTableRoute(): boolean { return this.router.url.startsWith('/table'); }

  isCoreApiRoute(): boolean { return this.router.url === '/api/core'; }

  isApiRoute(): boolean { return this.router.url === '/api/echarts'; }

  isHighchartsApiRoute(): boolean { return this.router.url === '/api/highcharts'; }

  isApexchartsApiRoute(): boolean { return this.router.url === '/api/apexcharts'; }

  isTableApiRoute(): boolean { return this.router.url === '/api/table'; }

  isOrganizerRoute(): boolean { return this.router.url === '/organizer'; }

  isOrganizerApiRoute(): boolean { return this.router.url === '/api/organizer'; }

  isChartsLib(key: string): boolean { return this.router.url.startsWith(`/charts/${key}`); }

  isExpanded(key: string): boolean { return this.expandedLibs.has(key); }

  isActiveType(lib: LibItem, type: ChartTypeItem): boolean {
    return this.router.url === `${lib.route}/${type.id}`;
  }

  goToTable() {
    this.router.navigate(['/table']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToCoreApi() {
    this.router.navigate(['/api/core']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToApi() {
    this.router.navigate(['/api/echarts']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToHighchartsApi() {
    this.router.navigate(['/api/highcharts']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToApexchartsApi() {
    this.router.navigate(['/api/apexcharts']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToTableApi() {
    this.router.navigate(['/api/table']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToOrganizer() {
    this.router.navigate(['/organizer']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToOrganizerApi() {
    this.router.navigate(['/api/organizer']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToLib(lib: LibItem) {
    this.expandedLibs.clear();
    this.expandedLibs.add(lib.key);
    this.router.navigate([lib.route]);
    if (this.isMenuOpen) this.toggleMenu();
  }

  toggleExpand(lib: LibItem, event: Event) {
    event.stopPropagation();
    if (this.expandedLibs.has(lib.key)) {
      this.expandedLibs.delete(lib.key);
    } else {
      this.expandedLibs.clear();
      this.expandedLibs.add(lib.key);
    }
    this.cdr.markForCheck();
  }

  goToType(lib: LibItem, type: ChartTypeItem, event: Event) {
    event.stopPropagation();
    this.router.navigate([lib.route, type.id]);
    if (this.isMenuOpen) this.toggleMenu();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.markForCheck();
  }
}
