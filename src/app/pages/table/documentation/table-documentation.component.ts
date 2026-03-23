import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-table-test-documentation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './table-documentation.component.html',
  styleUrls: ['./table-documentation.component.scss'],
})
export class TableTestDocumentationComponent {}
