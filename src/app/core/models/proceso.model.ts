export interface Proceso { 
    id: number; 
    empresaId: number; 
    nombre: string; 
}

export interface LoginResponse {
  exito: boolean;
  mensaje?: string;
  usuarioId?: number;
  empresaId?: number;
  empresaNombre?: string;
  nombre?: string;
  correo?: string;
  esAdmin?: boolean; // 👈 NUEVO
}