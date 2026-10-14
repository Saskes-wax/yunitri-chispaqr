import { ValidacionFallida } from '../shared/errores.js';

const PARTES = ['params', 'query', 'body'];

function resumirProblemas(issues) {
  return issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message }));
}

export function validar(esquemas) {
  return (req, _res, next) => {
    req.validado = {};
    for (const parte of PARTES) {
      if (!esquemas[parte]) continue;
      const resultado = esquemas[parte].safeParse(req[parte] ?? {});
      if (!resultado.success) {
        throw new ValidacionFallida(resumirProblemas(resultado.error.issues));
      }
      req.validado[parte] = resultado.data;
    }
    next();
  };
}
