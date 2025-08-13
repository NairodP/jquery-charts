import { EventEmitter, NgZone } from '@angular/core';
import { Highcharts } from './highcharts-modules';
import { ICONS } from '../../../assets/icons/icons';
import { ChartCustomEvent, ToolbarOptions } from './types';

export function removeToolbar(chart: Highcharts.Chart): void {
  if (!chart.container) return;

  const toolbar = chart.container.querySelector('.highcharts-custom-toolbar');
  if (!toolbar) return;

  const container = chart.container;
  container.removeEventListener('mousemove', handleMouseMove);
  container.removeEventListener('mouseleave', handleMouseLeave);
  toolbar.remove();
}

function handleMouseMove(event) {
  const toolbar = event.currentTarget.querySelector(
    '.highcharts-custom-toolbar'
  );
  if (toolbar) toolbar.style.visibility = 'visible';
}

function handleMouseLeave(event) {
  const toolbar = event.currentTarget.querySelector(
    '.highcharts-custom-toolbar'
  );
  if (toolbar) toolbar.style.visibility = 'hidden';
}

function createToolbarButton(
  icon: string,
  title: string,
  eventName: ChartCustomEvent,
  ngZone: NgZone,
  emitter: EventEmitter<ChartCustomEvent>
): HTMLButtonElement {
  const button = document.createElement('button');
  button.innerHTML = icon;
  button.className = 'custom-icon';
  button.title = title;

  button.style.background = 'transparent';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.padding = '0';
  button.style.margin = '0';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.borderRadius = '2px';
  button.style.transition = 'background-color 0.2s ease';
  button.style.width = '24px';
  button.style.height = '24px';
  button.style.minWidth = '24px';
  button.style.minHeight = '24px';
  button.style.boxSizing = 'border-box';
  button.style.flexShrink = '0';

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = 'rgba(60, 60, 60, 0.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'transparent';
  });

  const svg = button.querySelector('svg');
  if (svg) {
    svg.style.display = 'block';
    svg.style.fill = 'currentColor';
    svg.style.width = '24px';
    svg.style.height = '24px';
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    ngZone.run(() => emitter.emit(eventName));
  });
  return button;
}

export function setupToolbar(options: ToolbarOptions): void {
  const { chart, config, customEvent, ngZone, canPivot = true, debug = false } = options;

  if (!chart || !config.showToolbar) return;
  if (!chart.container) return;

  try {
    removeToolbar(chart);
    const container = chart.container;

    const hasTitle = chart.options.title?.text && chart.options.title.text !== '';
    const hasSubtitle = chart.options.subtitle?.text && chart.options.subtitle.text !== '';

    if (!hasTitle && !hasSubtitle) {
      chart.update({
        chart: {
          ...chart.options.chart,
          spacingTop: 45
        }
      }, false);
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'highcharts-custom-toolbar';
    toolbar.style.position = 'absolute';

    const hasExportButton = chart.options.exporting?.enabled === true && chart.options.exporting?.buttons?.contextButton?.enabled !== false;

    toolbar.style.right = hasExportButton ? '2.5em' : '3px';
    toolbar.style.top = hasExportButton ? '0.8em' : '10px';
    toolbar.style.color = '#555555';
    toolbar.style.zIndex = '10';
    toolbar.style.display = 'flex';
    toolbar.style.visibility = 'hidden';
    toolbar.style.gap = '4px';

    toolbar.appendChild(createToolbarButton(ICONS.previous, 'Graphique précédent', 'previous', ngZone, customEvent));
    toolbar.appendChild(createToolbarButton(ICONS.next, 'Graphique suivant', 'next', ngZone, customEvent));

    if (canPivot) {
      toolbar.appendChild(createToolbarButton(ICONS.pivot, 'Pivot', 'pivot', ngZone, customEvent));
    }

    toolbar.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    container.appendChild(toolbar);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    debug && console.log("Barre d'outils personnalisée configurée");
  } catch (error) {
    console.error(
      "Erreur lors de la configuration de la barre d'outils:",
      error
    );
  }
}

export function configureChartEvents(
  chartOptions: Highcharts.Options,
  toolbarOptions: ToolbarOptions
): void {
  const originalRenderCallback = chartOptions.chart?.events?.render;
  chartOptions.chart.events = chartOptions.chart.events || {};

  chartOptions.chart.events.render = function (this: Highcharts.Chart) {
    if (typeof originalRenderCallback === 'function') {
      originalRenderCallback.call(this);
    }

    toolbarOptions.chart = this;

    toolbarOptions.ngZone.runOutsideAngular(() => {
      setupToolbar(toolbarOptions);
    });
  };
}
