import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';

const routes: Routes = [
  // Login (fuera del layout)
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login),
  },

  // Layout (sidebar) protegido
  {
    path: '',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'automatizaciones',
        loadComponent: () =>
          import('./pages/automatizaciones/automatizaciones')
            .then(m => m.AutomatizacionesComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/perfil/perfil')
            .then(m => m.PerfilComponent),
      },
      { path: '', redirectTo: 'automatizaciones', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
