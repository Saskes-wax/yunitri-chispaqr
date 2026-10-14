export class ErrorApp extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.name = this.constructor.name;
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export class ValidacionFallida extends ErrorApp {
  constructor(detalles, mensaje = 'Datos inválidos') {
    super(400, 'VALIDACION_FALLIDA', mensaje, detalles);
  }
}

export class NoAutenticado extends ErrorApp {
  constructor(mensaje = 'Debes iniciar sesión') {
    super(401, 'NO_AUTENTICADO', mensaje);
  }
}

export class Prohibido extends ErrorApp {
  constructor(mensaje = 'No tienes permiso para esta acción') {
    super(403, 'PROHIBIDO', mensaje);
  }
}

export class NoEncontrado extends ErrorApp {
  constructor(recurso) {
    super(404, 'NO_ENCONTRADO', `${recurso} no encontrado`);
  }
}

export class Conflicto extends ErrorApp {
  constructor(codigo, mensaje) {
    super(409, codigo, mensaje);
  }
}
