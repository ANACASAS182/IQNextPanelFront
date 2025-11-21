import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IqnextService } from '../../core/services/iqnext.service';   
import { LoginResponse } from '../../core/models/proceso.model';            
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

    this.iqnextService.login(correo, contrasena).subscribe({
      next: (resp: LoginResponse) => {
        if (!resp.exito) {
          this.error = resp.mensaje ?? 'Credenciales incorrectas';
          this.loading = false;
          return;
        }

        // Guardar datos del usuario
        localStorage.setItem('usuario', JSON.stringify(resp));

        // Redirigir
        this.router.navigate(['/automatizaciones']);
      },
      error: () => {
        this.error = 'Error al iniciar sesión';
        this.loading = false;
      }
    });
  }
}
