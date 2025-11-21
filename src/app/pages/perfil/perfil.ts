import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { IqnextService } from '../../core/services/iqnext.service';

type UsuarioLocal = {
  nombre?: string | null;
  correo?: string | null;
  empresaNombre?: string | null;
  empresaId?: number | null;
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.scss'],
})
export class PerfilComponent {
  user: UsuarioLocal = {};

  loading = false;
  okMsg = '';
  errMsg = '';

  form!: FormGroup;

  constructor(private fb: FormBuilder, private api: IqnextService) {
    this.form = this.fb.group(
      {
        passwordActual: ['', Validators.required],
        passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
        passwordNueva2: ['', Validators.required],
      },
      { validators: [PerfilComponent.matchPasswords] }
    );
  }

  ngOnInit() {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      const u = JSON.parse(raw);
      this.user = {
        nombre: u?.nombre ?? null,
        correo: u?.correo ?? null,
        empresaNombre: u?.empresaNombre ?? null,
        empresaId: u?.empresaId ?? u?.empresaID ?? null,
      };
    }
  }

  static matchPasswords(group: AbstractControl): ValidationErrors | null {
    const p1 = group.get('passwordNueva')?.value;
    const p2 = group.get('passwordNueva2')?.value;
    return p1 && p2 && p1 !== p2 ? { mismatch: true } : null;
  }

  get f() { return this.form.controls; }

  cambiarPassword() {
    this.okMsg = '';
    this.errMsg = '';

    if (this.form.invalid || !this.user?.empresaId || !this.user?.correo) {
      this.errMsg = 'Completa el formulario correctamente.';
      return;
    }

    const { passwordActual, passwordNueva } = this.form.value;

    this.loading = true;
    this.api.cambiarPassword({
      empresaId: this.user.empresaId!,
      correo: this.user.correo!,
      passwordActual: passwordActual!,
      passwordNueva: passwordNueva!,
    })
    .subscribe({
      next: (r) => {
        if (r.exito) {
          this.okMsg = r.mensaje || 'Contraseña actualizada.';
          this.form.reset();
        } else {
          this.errMsg = r.mensaje || 'No se pudo actualizar la contraseña.';
        }
        this.loading = false;
      },
      error: (e) => {
        this.errMsg = e?.error?.mensaje || 'Error al actualizar la contraseña.';
        this.loading = false;
      }
    });
  }
}
