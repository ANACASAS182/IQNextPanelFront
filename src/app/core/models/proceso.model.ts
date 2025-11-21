export interface Proceso { 
    id: number; 
    empresaId: number; 
    nombre: string; 
}

export interface LoginResponse {
  exito: boolean;
  mensaje: string;
  usuarioId: number | null;
  empresaId: number | null;
  empresaNombre: string | null;
  nombre: string | null;
  correo: string | null;
}
