import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IqnextService } from '../../core/services/iqnext.service';
import { Proceso } from '../../core/models/proceso.model';
import { Ejecucion } from '../../core/models/ejecucion.model';
import { forkJoin, of, switchMap, map, tap, catchError } from 'rxjs';

type ProcesoView = Proceso & {
  ultima?: string;
  total0: number;
  total1: number;
};

@Component({
  selector: 'app-automatizaciones',
  templateUrl: './automatizaciones.html',   // ⬅️ nombre real del archivo
  styleUrls: ['./automatizaciones.scss'],    // ⬅️ nombre real del archivo

  // ⬅️ IMPORTANTE: agrega estos imports
  imports: [
    CommonModule,    // ngIf, ngFor, ngClass
    DatePipe         // pipe "date"
  ],
  standalone: true   // ⬅️ hazlo standalone para que funcione
})
export class AutomatizacionesComponent {

  procesos: ProcesoView[] = [];
  selectedProceso?: ProcesoView;
  ejecuciones: Ejecucion[] = [];

  loadingProcesos = false;
  loadingDetalle = false;
  errorMsg?: string;

  empresaId!: number;

  constructor(private api: IqnextService) {}

  ngOnInit() {
    this.obtenerEmpresaDelUsuario();
    this.cargarProcesos(this.empresaId);
  }

  obtenerEmpresaDelUsuario() {
    const data = localStorage.getItem('usuario');
    if (!data) return;
    const user = JSON.parse(data);
    this.empresaId = user.empresaId;
  }

  get visibleProcesos(): ProcesoView[] {
    return this.selectedProceso
      ? this.procesos.filter(p => p.id === this.selectedProceso!.id)
      : this.procesos;
  }

  trackById = (_: number, p: ProcesoView) => p.id;

  private cargarProcesos(empresaId: number) {
    this.loadingProcesos = true;
    this.api.getProcesosByEmpresa(empresaId).pipe(
      switchMap((procs) => {
        if (!procs.length) return of([] as ProcesoView[]);

        const calls = procs.map(p => this.api.getEjecucionesByProceso(p.id));

        return forkJoin(calls).pipe(
          map(listas => procs.map((p, i) => {
            const ej = listas[i] ?? [];
            const sorted = [...ej].sort((a, b) =>
              new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
            );
            const ultima = sorted[0]?.fechaHora;
            const total0 = ej.filter(x => x.estatus === 0).length;
            const total1 = ej.filter(x => x.estatus === 1).length;

            return { ...p, ultima, total0, total1 } as ProcesoView;
          }))
        );
      }),
      tap(() => this.errorMsg = undefined),
      catchError(err => {
        this.errorMsg = 'No se pudo cargar procesos.';
        console.error(err);
        return of([]);
      })
    ).subscribe(res => {
      this.procesos = res;
      this.loadingProcesos = false;
    });
  }

  verDetalle(proc: ProcesoView) {
    this.selectedProceso = proc;
    this.loadingDetalle = true;

    this.api.getEjecucionesByProceso(proc.id).pipe(
      tap(() => this.errorMsg = undefined),
      catchError(err => {
        this.errorMsg = 'No se pudo cargar ejecuciones.';
        console.error(err);
        return of([]);
      })
    ).subscribe(res => {
      this.ejecuciones = res.sort((a, b) =>
        new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
      );
      this.loadingDetalle = false;
    });
  }

  limpiarDetalle() {
    this.selectedProceso = undefined;
    this.ejecuciones = [];
  }
}
