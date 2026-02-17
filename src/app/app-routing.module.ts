import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BasicTestComponent } from './pages/basic-test/basic-test.component';
import { SandboxComponent } from './pages/basic-test/sandbox/sandbox.component';
import { TableTestComponent } from './pages/table/table.component';
import { TableTestDocumentationComponent } from './pages/table/documentation/table-documentation.component';
import { TableColumnsExampleComponent } from './pages/table/test/test.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },

  // uncomment if you want to add the test page
  { path: 'basic-test', component: BasicTestComponent },
  { path: 'basic-test/sandbox', component: SandboxComponent },
  { path: 'table', component: TableTestComponent },
  { path: 'table/test', component: TableColumnsExampleComponent },
  { path: 'table/documentation', component: TableTestDocumentationComponent },
  { path: 'table-test', redirectTo: 'table/test', pathMatch: 'full' },
  { path: 'table-test/documentation', redirectTo: 'table/documentation', pathMatch: 'full' },
  { path: 'tables-test/documentation', redirectTo: 'table/documentation', pathMatch: 'full' },
  {
    path: 'documentation',
    loadChildren: () =>
      import('./pages/documentation/documentation.module').then(
        (m) => m.DocumentationModule
      ),
  },
  {
    path: 'charts',
    loadChildren: () =>
      import('./pages/charts/charts.module').then((m) => m.ChartsModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
