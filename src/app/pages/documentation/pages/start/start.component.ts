import { Component } from '@angular/core';

@Component({
  selector: 'app-documentation-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
})
export class DocumentationStartComponent {
  readonly commonExample = `import { field } from '@oneteme/jquery-core';

const config = {
  height: 280,
  series: [{
    name: 'Ventes',
    data: { x: field('month'), y: field('value') },
  }],
};

<chart type="line" [config]="config" [data]="rows"></chart>`;
}
