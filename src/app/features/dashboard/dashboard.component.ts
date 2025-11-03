import { Component } from '@angular/core';
import { IqnextService } from '../../core/services/iqnext.service';
import { Empresa } from '../../core/models/empresa.model';
import { Proceso } from '../../core/models/proceso.model';
import { Ejecucion } from '../../core/models/ejecucion.model';
import { forkJoin, of, switchMap, map, tap, catchError } from 'rxjs';

type ProcesoView = Proceso & {
  ultima?: string;
  total0: number;
  total1: number;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent {
  empresas: Empresa[] = [];
  procesos: ProcesoView[] = [];
  selectedEmpresaId?: number;

  // Detalle del proceso seleccionado
  selectedProceso?: ProcesoView;
  ejecuciones: Ejecucion[] = [];

  loadingEmpresas = false;
  loadingProcesos = false;
  loadingDetalle = false;
  errorMsg?: string;

  constructor(private api: IqnextService) {}

  ngOnInit() { this.cargarEmpresas(); }

  /** ✅ Lista visible:
   *  - Por defecto: todos los procesos de la empresa
   *  - Al ver detalle: solo el proceso seleccionado (los demás “desaparecen”)
   */
  get visibleProcesos(): ProcesoView[] {
    return this.selectedProceso
      ? this.procesos.filter(p => p.id === this.selectedProceso!.id)
      : this.procesos;
  }

  trackById = (_: number, p: ProcesoView) => p.id;

  private cargarEmpresas() {
    this.loadingEmpresas = true;
    this.api.getEmpresas()
      .pipe(
        tap(() => this.errorMsg = undefined),
        catchError(err => { this.errorMsg = 'No se pudo cargar empresas.'; console.error(err); return of([]); })
      )
      .subscribe(res => { this.empresas = res; this.loadingEmpresas = false; });
  }

  onEmpresaChange(id: number) {
    this.selectedEmpresaId = id;
    this.selectedProceso = undefined; // ← vuelve a mostrar todos los procesos
    this.ejecuciones = [];
    this.cargarProcesos(id);
  }

  private cargarProcesos(empresaId: number) {
    this.loadingProcesos = true;
    this.api.getProcesosByEmpresa(empresaId).pipe(
      switchMap((procs) => {
        if (!procs.length) return of([] as ProcesoView[]);
        const calls = procs.map(p => this.api.getEjecucionesByProceso(p.id));
        return forkJoin(calls).pipe(
          map(listas => procs.map((p, i) => {
            const ej = listas[i] ?? [];
            const sorted = [...ej].sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
            const ultima = sorted[0]?.fechaHora;
            const total0 = ej.filter(x => x.estatus === 0).length;
            const total1 = ej.filter(x => x.estatus === 1).length;
            return { ...p, ultima, total0, total1 } as ProcesoView;
          }))
        );
      }),
      tap(() => this.errorMsg = undefined),
      catchError(err => { this.errorMsg = 'No se pudo cargar procesos.'; console.error(err); return of([] as ProcesoView[]); })
    ).subscribe(res => { this.procesos = res; this.loadingProcesos = false; });
  }

  verDetalle(proc: ProcesoView) {
    // 1) Marca proceso seleccionado (oculta demás en la tabla)
    this.selectedProceso = proc;

    // 2) Carga ejecuciones
    this.loadingDetalle = true;
    this.api.getEjecucionesByProceso(proc.id).pipe(
      tap(() => this.errorMsg = undefined),
      catchError(err => { this.errorMsg = 'No se pudo cargar ejecuciones.'; console.error(err); return of([]); })
    ).subscribe(res => {
      this.ejecuciones = res.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
      this.loadingDetalle = false;
    });
  }

  limpiarDetalle() {
    // Al hacer clic en "Ocultar": vuelven a mostrarse todos los procesos
    this.selectedProceso = undefined;
    this.ejecuciones = [];
  }
}