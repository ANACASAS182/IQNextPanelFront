import { Injectable } from '@angular/core';
import { HttpClient , HttpErrorResponse, HttpResponse  } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Empresa } from '../models/empresa.model';
import { Proceso } from '../models/proceso.model';
import { Ejecucion } from '../models/ejecucion.model';
import { LoginResponse } from '../models/proceso.model';
import {  catchError, map, throwError, tap } from 'rxjs';


export interface CambiarPasswordResp { exito: boolean; mensaje: string;}

export interface CrearProcesoResp { id: number; empresaId: number; nombre: string;  uuid: string;}
export interface ApiCurlResponse {
  procesoId: number;
  uuid: string;
  curlEstatus1: string;
  curlEstatus0: string;
}

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

 login(correo: string, contrasena: string): Observable<LoginResponse> {
    const url = `${this.base}/Login`;
    const body = { correo, contrasena };

    const t0 = performance.now();
    // No logueo la contraseña por obvias razones
    console.log('[API] POST', url, { correo, hasPassword: !!contrasena });

    return this.http.post<LoginResponse>(url, body, { observe: 'response' }).pipe(
      tap((resp: HttpResponse<LoginResponse>) => {
        const ms = Math.round(performance.now() - t0);
        console.log('[API] status', resp.status, 'ms', ms);
        console.log('[API] body', resp.body);
      }),
      map(r => r.body as LoginResponse),
      catchError((err: HttpErrorResponse) => {
        const ms = Math.round(performance.now() - t0);
        console.error('[API] ERROR', {
          ms,
          status: err.status,
          url: err.url,
          message: err.message,
          errorBody: err.error
        });
        return throwError(() => err);
      })
    );
  }

 cambiarPassword(payload: {
    empresaId: number;
    correo: string;
    passwordActual: string;
    passwordNueva: string;
  }): Observable<CambiarPasswordResp> {
    return this.http.post<CambiarPasswordResp>(`${this.base}/CambiarPassword`, payload);
  }

    crearProceso(empresaId: number, nombre: string): Observable<CrearProcesoResp> {
    return this.http.post<CrearProcesoResp>(`${this.base}/CrearProceso`, {
      empresaId,
      nombre
    });
  }

 getCurlByProcesoId(procesoId: number): Observable<ApiCurlResponse> {
    // Respeta exactamente la ruta que tienes en el backend:
    // [HttpGet("GetRegistrarCurl/{procesoId}")]
    return this.http.get<ApiCurlResponse>(`${this.base}/GetRegistrarCurl/${procesoId}`);
  }

}