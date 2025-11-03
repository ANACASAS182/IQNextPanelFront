import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Empresa } from '../models/empresa.model';
import { Proceso } from '../models/proceso.model';
import { Ejecucion } from '../models/ejecucion.model';

@Injectable({ providedIn: 'root' })
export class IqnextService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.base}/GetEmpresas`);
  }

  getProcesosByEmpresa(empresaId: number): Observable<Proceso[]> {
    return this.http.get<Proceso[]>(`${this.base}/GetProcesoEmpresas/${empresaId}`);
  }

  getEjecucionesByProceso(procesoId: number): Observable<Ejecucion[]> {
    return this.http.get<Ejecucion[]>(`${this.base}/GetEjecucionesProcesos/${procesoId}`);
  }
}