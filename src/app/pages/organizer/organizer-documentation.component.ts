import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrganizerButtonComponent, OrganizerButtonEvent, OrganizerConfig, OrganizerState } from '@oneteme/jquery-organizer';

@Component({
  selector: 'app-organizer-documentation',
  standalone: true,
  imports: [CommonModule, RouterLink, OrganizerButtonComponent],
  templateUrl: './organizer-documentation.component.html',
  styleUrls: ['./organizer-documentation.component.scss'],
})
export class OrganizerDocumentationComponent {
  readonly organizerConfig: OrganizerConfig = {
    fields: [
      { id: 'sales', label: 'Ventes', visible: true },
      { id: 'orders', label: 'Commandes', visible: true },
      { id: 'margin', label: 'Marge', visible: false },
    ],
    xFields: [
      { id: 'month', label: 'Mois' },
      { id: 'region', label: 'Région' },
    ],
    yFields: [
      { id: 'sales', label: 'Ventes', aggregates: [{ id: 'sum', label: 'Somme' }] },
      { id: 'orders', label: 'Commandes', aggregates: [{ id: 'count', label: 'Nombre' }] },
    ],
    groups: [
      { id: 'region', label: 'Région' },
      { id: 'status', label: 'Statut' },
    ],
    templates: [
      { id: 'commercial', label: 'Vue commerciale', xField: 'month', yField: 'sales' },
      { id: 'regional', label: 'Vue par région', xField: 'region', yField: 'sales', groupBy: 'region' },
    ],
  };

  organizerState: OrganizerState = {
    visibleFields: ['sales', 'orders'],
    selectedX: 'month',
    selectedY: 'sales',
    selectedYAggregate: 'sum',
  };

  lastEvent = 'Aucune interaction pour le moment';

  onViewChange(event: OrganizerButtonEvent): void {
    this.organizerState = event.state;
    this.lastEvent = `${event.type} : ${this.describeState(event.state)}`;
  }

  private describeState(state: OrganizerState): string {
    const visible = state.visibleFields?.join(', ') || 'aucun champ';
    const group = state.selectedGroupBy || 'aucun regroupement';
    return `champs visibles = ${visible}, groupe = ${group}`;
  }
}
