import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IqnextService } from '../../core/services/iqnext.service';
import { LoginResponse } from '../../core/models/proceso.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  loading = false;
  error = '';
  form: any;

  constructor(
    private fb: FormBuilder,
    private iqnextService: IqnextService,
    private router: Router
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required]]
    });
  }

  ingresar() {
    if (this.form.invalid) {
      this.error = 'Completa los campos correctamente';
      return;
    }

    this.loading = true;
    this.error = '';

    const { correo, contrasena } = this.form.value;

    const t0 = performance.now();
    console.groupCollapsed('%cLOGIN', 'color:#0af');
    console.log('[LOGIN] intento', { correo, hasPassword: !!contrasena });

    this.iqnextService.login(correo, contrasena).subscribe({
      next: (resp: LoginResponse) => {
        const t1 = performance.now();
        console.log('[LOGIN] respuesta API', resp);
        console.log('[LOGIN] tiempo(ms)', Math.round(t1 - t0));

        if (!resp?.exito) {
          this.error = resp?.mensaje ?? 'Credenciales incorrectas';
          console.warn('[LOGIN] exito:false ->', this.error);
          this.loading = false;
          console.groupEnd();
          return;
        }

        try {
          localStorage.setItem('usuario', JSON.stringify(resp));
          console.log('[LOGIN] usuario guardado en localStorage');
        } catch (e) {
          console.error('[LOGIN] error guardando en localStorage', e);
        }

        this.loading = false;
        console.log('[LOGIN] navegar /automatizaciones');
        console.groupEnd();
        this.router.navigate(['/automatizaciones']);
      },
      error: (err: unknown) => {
        const t1 = performance.now();
        let msg = 'Error al iniciar sesión';

        if (err instanceof HttpErrorResponse) {
          console.error('[LOGIN] HTTP error', {
            status: err.status,
            statusText: err.statusText,
            url: err.url,
            message: err.message,
            errorBody: err.error
          });
          if (err.error && typeof err.error === 'object' && 'mensaje' in err.error) {
            msg = (err.error as any).mensaje || msg;
          }
        } else {
          console.error('[LOGIN] error desconocido', err);
        }

        console.log('[LOGIN] tiempo(ms)', Math.round(t1 - t0));
        this.error = msg;
        this.loading = false;
        console.groupEnd();
      }
    });
  }
}
