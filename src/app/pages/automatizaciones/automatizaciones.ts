// pages/automatizaciones/automatizaciones.ts
import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IqnextService } from '../../core/services/iqnext.service';
import { Proceso } from '../../core/models/proceso.model';
import { Ejecucion } from '../../core/models/ejecucion.model';
import { forkJoin, of, switchMap, map, tap, catchError } from 'rxjs';
import { FormsModule } from '@angular/forms';

type ProcesoView = Proceso & { ultima?: string; total0: number; total1: number };

@Component({
  selector: 'app-automatizaciones',
  templateUrl: './automatizaciones.html',
  styleUrls: ['./automatizaciones.scss'],
  imports: [CommonModule, DatePipe, FormsModule],
  standalone: true
})
export class AutomatizacionesComponent {
  procesos: ProcesoView[] = [];
  selectedProceso?: ProcesoView;
  ejecuciones: Ejecucion[] = [];
  loadingProcesos = false;
  loadingDetalle = false;
  errorMsg?: string;

  empresaId!: number;
  isAdmin = false;

  // Modal API (solo estatus 1)
  showApi = false;
  apiProcesoId?: number;
  apiProcesoNombre = '';
  apiLoading = false;
  apiError = '';
  apiCurl1 = '';

  // Modal crear
  showCrear = false;
  crearNombre = '';
  crearLoading = false;
  crearError = '';

  // Toast
  toastVisible = false;
  toastMsg = '';

  constructor(private api: IqnextService) {}

  ngOnInit() {
    this.leerUsuarioDeStorage();
    if (this.empresaId) this.cargarProcesos(this.empresaId);
  }

  abrirApi(p: ProcesoView) {
    this.showApi = true;
    this.apiProcesoId = p.id;
    this.apiProcesoNombre = p.nombre;
    this.apiLoading = true;
    this.apiError = '';
    this.apiCurl1 = '';

    // El servicio puede devolver ambos cURL; aquí solo usamos el de estatus 1
    this.api.getCurlByProcesoId(p.id).subscribe({
      next: (res: { procesoId: number; uuid: string; curlEstatus1: string; curlEstatus0?: string }) => {
        this.apiCurl1 = res.curlEstatus1;
        this.apiLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.apiError = 'No se pudo obtener el cURL.';
        this.apiLoading = false;
      }
    });
  }

  cerrarApi() {
    this.showApi = false;
  }

  copiar(texto: string) {
    navigator.clipboard?.writeText(texto);
    this.toastMsg = 'Copiado al portapapeles';
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 1500);
  }

  private leerUsuarioDeStorage() {
    const data = localStorage.getItem('usuario');
    if (!data) return;
    try {
      const user = JSON.parse(data) as { empresaId?: number; esAdmin?: boolean };
      this.empresaId = Number(user?.empresaId);
      this.isAdmin = !!user?.esAdmin;
    } catch {
      this.empresaId = undefined as any;
      this.isAdmin = false;
    }
  }

  get visibleProcesos(): ProcesoView[] {
    return this.selectedProceso ? this.procesos.filter(p => p.id === this.selectedProceso!.id) : this.procesos;
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
            const sorted = [...ej].sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
            const ultima = sorted[0]?.fechaHora;
            const total0 = ej.filter(x => x.estatus === 0).length; // sigue existiendo en back, solo no lo mostramos en el modal
            const total1 = ej.filter(x => x.estatus === 1).length;
            return { ...p, ultima, total0, total1 } as ProcesoView;
          }))
        );
      }),
      tap(() => (this.errorMsg = undefined)),
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
      tap(() => (this.errorMsg = undefined)),
      catchError(err => {
        this.errorMsg = 'No se pudo cargar ejecuciones.';
        console.error(err);
        return of([]);
      })
    ).subscribe(res => {
      this.ejecuciones = res.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
      this.loadingDetalle = false;
    });
  }

  limpiarDetalle() {
    this.selectedProceso = undefined;
    this.ejecuciones = [];
  }

  agregarProceso() {
    this.crearNombre = '';
    this.crearError = '';
    this.showCrear = true;
  }
  cancelarCrear() {
    if (this.crearLoading) return;
    this.showCrear = false;
    this.crearNombre = '';
    this.crearError = '';
  }
  guardarCrear() {
    if (!this.crearNombre?.trim()) {
      this.crearError = 'Escribe un nombre.';
      return;
    }
    this.crearLoading = true;
    this.crearError = '';

    this.api.crearProceso(this.empresaId, this.crearNombre.trim()).subscribe({
      next: () => {
        this.cargarProcesos(this.empresaId);
        this.crearLoading = false;
        this.showCrear = false;
      },
      error: (err) => {
        console.error(err);
        this.crearError = 'No se pudo crear el proceso.';
        this.crearLoading = false;
      }
    });
  }
}
