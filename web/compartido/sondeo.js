const INTERVALO_NORMAL_MS = 5_000;
const INTERVALO_MAXIMO_MS = 60_000;

// Consulta periódica: pausa con la pestaña oculta, espera creciente ante errores y nunca dos consultas a la vez.
export function crearSondeo(consultar, { alCambiarConexion = () => {} } = {}) {
  let intervalo = INTERVALO_NORMAL_MS;
  let temporizador = null;
  let enCurso = false;
  let activo = false;

  async function ejecutar() {
    if (!activo || enCurso) return;
    enCurso = true;
    try {
      await consultar();
      intervalo = INTERVALO_NORMAL_MS;
      alCambiarConexion(true);
    } catch (error) {
      intervalo = Math.min(intervalo * 2, INTERVALO_MAXIMO_MS);
      alCambiarConexion(false, error);
    } finally {
      enCurso = false;
      programar();
    }
  }

  function programar() {
    clearTimeout(temporizador);
    if (activo && !document.hidden) {
      temporizador = setTimeout(ejecutar, intervalo);
    }
  }

  function alCambiarVisibilidad() {
    if (document.hidden) {
      clearTimeout(temporizador);
    } else {
      ejecutar();
    }
  }

  return {
    iniciar() {
      if (activo) return;
      activo = true;
      document.addEventListener('visibilitychange', alCambiarVisibilidad);
      ejecutar();
    },
    detener() {
      activo = false;
      clearTimeout(temporizador);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    },
    ahora: ejecutar,
  };
}
