import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostBinding, HostListener, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ChartProvider, ChartType, FullscreenManager, OrganizerConfig, VisualCopyFeedbackConfig, VisualSnapshot, VisualSnapshotApplyResult, VisualSnapshotDraft, VisualSnapshotStorage, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartDirective, GroupSyncMode } from '../directive/chart.directive';
import { EChartsOption } from '../directive/utils/types';
import { ChartCustomEvent } from '../directive/utils/types';
import { ChartViewFacade } from './view/chart-view.facade';

@Component({
  standalone: true,
  imports: [CommonModule, ChartDirective],
  selector: 'chart',
  templateUrl: './chart.component.html',
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    :host.visual-fullscreen { width: 100vw; height: 100vh; background: #fff; }
    .chart-frame { position: relative; width: 100%; height: 100%; }
    .chart-canvas { width: 100%; height: 100%; }
    .visual-copy-feedback {
      position: absolute;
      top: 10px;
      left: 50%;
      z-index: 2;
      transform: translateX(-50%);
      padding: 7px 12px;
      border: 1px solid #c7dfd1;
      border-radius: 5px;
      background: rgba(244, 251, 247, 0.96);
      color: #24613b;
      font-size: 12px;
      pointer-events: none;
    }
  `],
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> implements OnChanges, OnDestroy {
  private readonly _element = inject(ElementRef<HTMLElement>);
  @HostBinding('class.visual-fullscreen') _isFullscreen = false;

  @Input({ required: true }) type: ChartType;
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];

  @Input() isLoading: boolean;
  @Input() debug: boolean;
  @Input() theme: string | null = null;
  @Input() renderer: 'svg' | 'canvas' = 'svg';
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  @Input() group: string | null = null;
  @Input() groupSync: GroupSyncMode | null = null;
  @Input() renderedOption?: EChartsOption | null;

  /** Active la gestion de la visibilité des séries via le panneau Organizer. */
  @Input() organizer?: OrganizerConfig;
  @Input() copyFeedback: VisualCopyFeedbackConfig = {};

  _effectiveConfig!: ChartProvider<X, Y>;

  readonly _organizerFacade = new ChartViewFacade<X, Y>();

  @HostBinding('style.height') get hostHeight(): string | null {
    return this.config?.height ? `${this.config.height}px` : null;
  }

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<any>();
  @Output() visualCopied = new EventEmitter<VisualSnapshot>();

  copyFeedbackMessage = '';
  private _copyFeedbackTimer?: number;

  @ViewChild(ChartDirective) private _directive: ChartDirective<X, Y>;

  exportImage(fileName?: string, type?: 'png' | 'jpeg' | 'svg', pixelRatio?: number): void {
    this._directive?.exportImage(fileName, type, pixelRatio);
  }

  exportData(fileName?: string, separator?: string): void {
    this._directive?.exportData(fileName, separator);
  }

  get fullscreenSupported(): boolean { return FullscreenManager.isSupported(this._element.nativeElement); }

  async toggleFullscreen(): Promise<void> {
    try {
      await FullscreenManager.toggle(this._element.nativeElement);
    } catch {
      this._isFullscreen = false;
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this._isFullscreen = FullscreenManager.isActive(this._element.nativeElement);
  }

  /** Capture les données courantes et la configuration sérialisable du graphique. */
  createVisualSnapshot(label = this.config?.title || 'Graphique'): VisualSnapshotDraft {
    const warnings: string[] = [];
    if (containsFunction(this.config)) {
      warnings.push('Certains providers ou callbacks du graphique ne sont pas transportables.');
    }
    return {
      type: 'chart',
      label,
      config: jsonClone({
        type: this.type,
        provider: this._effectiveConfig,
        theme: this.theme,
        renderer: this.renderer,
        renderedOption: this._directive?.getRenderedOption(),
      }),
      state: jsonClone({
        selectedFieldIds: this._organizerFacade.state.selectedFieldIds,
      }),
      data: jsonClone(this.data ?? []),
      warnings,
    };
  }

  copyVisualSnapshot(label?: string): VisualSnapshot | null {
    const snapshotLabel = label ?? (this.config?.title || 'Graphique');
    if (!snapshotLabel?.trim()) return null;
    const snapshot = new VisualSnapshotStorage().create(this.createVisualSnapshot(snapshotLabel.trim()));
    this.visualCopied.emit(snapshot);
    this.showCopyFeedback();
    return snapshot;
  }

  /** Applique l'état de visibilité compatible et retourne les données capturées. */
  applyVisualSnapshot(snapshot: VisualSnapshot): VisualSnapshotApplyResult {
    if (snapshot.type !== 'chart') {
      return { applied: false, restored: [], skipped: ['type'], warnings: ['Le snapshot n\'est pas un graphique.'] };
    }
    const selectedFieldIds = (snapshot.state as { selectedFieldIds?: string[] }).selectedFieldIds;
    const availableIds = new Set(this._organizerFacade.viewFields.map(field => field.id));
    const compatibleIds = selectedFieldIds?.filter(id => availableIds.has(id)) ?? [];
    const skipped = selectedFieldIds?.filter(id => !availableIds.has(id)) ?? [];
    if (selectedFieldIds) {
      this._organizerFacade.state.selectedFieldIds = compatibleIds;
      this._effectiveConfig = this._organizerFacade.getEffectiveProvider();
    }
    return {
      applied: true,
      restored: selectedFieldIds ? ['seriesVisibility'] : [],
      skipped,
      warnings: snapshot.warnings ?? [],
      data: jsonClone(snapshot.data),
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['organizer']) {
      if (this.config) {
        this._organizerFacade.update(this.organizer ?? {}, this.config);
      }
      this._effectiveConfig = this.config ? this._organizerFacade.getEffectiveProvider() : this.config;
    }
  }

  ngOnDestroy(): void {
    if (this._copyFeedbackTimer !== undefined) window.clearTimeout(this._copyFeedbackTimer);
    this._organizerFacade.destroy();
  }

  private showCopyFeedback(): void {
    if (this.copyFeedback.enabled === false) return;
    this.copyFeedbackMessage = this.copyFeedback.message || 'Copié';
    if (this._copyFeedbackTimer !== undefined) window.clearTimeout(this._copyFeedbackTimer);
    this._copyFeedbackTimer = window.setTimeout(() => this.copyFeedbackMessage = '', this.copyFeedback.durationMs ?? 2200);
  }
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, nested) =>
    typeof nested === 'function' ? undefined : nested,
  )) as T;
}

function containsFunction(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some(nested => containsFunction(nested, seen));
}
