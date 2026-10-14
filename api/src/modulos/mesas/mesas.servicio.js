import { randomBytes } from 'node:crypto';
import { conTransaccion } from '../../db/transaccion.js';
import { Conflicto, NoEncontrado } from '../../shared/errores.js';
import { firmarTokenComensal } from '../../shared/tokens.js';
import * as mesasRepo from './mesas.repositorio.js';

const BYTES_CODIGO_QR = 24;

export function generarCodigoQr() {
  return randomBytes(BYTES_CODIGO_QR).toString('base64url');
}

export async function obtenerMesaPorCodigoQr(codigoQr) {
  const mesa = await mesasRepo.buscarPorCodigoQr(codigoQr);
  if (!mesa) {
    throw new NoEncontrado('Mesa');
  }
  return { numero: mesa.numero, zona: mesa.zona, activa: mesa.activa };
}

async function obtenerOAbrirSesion(cliente, idMesa) {
  return (await mesasRepo.buscarSesionAbierta(cliente, idMesa)) ?? mesasRepo.abrirSesion(cliente, idMesa);
}

export async function registrarComensal({ codigoQr, nombre }) {
  return conTransaccion(async (cliente) => {
    // FOR UPDATE: dos comensales que escanean a la vez comparten la misma sesión de mesa.
    const mesa = await mesasRepo.bloquearPorCodigoQr(cliente, codigoQr);
    if (!mesa) {
      throw new NoEncontrado('Mesa');
    }
    if (!mesa.activa) {
      throw new Conflicto('MESA_INACTIVA', 'Esta mesa no está atendiendo en este momento');
    }

    const idSesion = await obtenerOAbrirSesion(cliente, mesa.idMesa);
    const idComensal = await mesasRepo.insertarComensal(cliente, { idSesion, nombre });

    return {
      token: firmarTokenComensal({ idComensal, idSesion, idMesa: mesa.idMesa }),
      comensal: { idComensal, nombre },
      mesa: { numero: mesa.numero, zona: mesa.zona },
    };
  });
}

export function crearMesa(datos) {
  return mesasRepo.insertarMesa(datos);
}

export async function regenerarQr(idMesa) {
  const mesa = await mesasRepo.actualizarCodigoQr(idMesa, generarCodigoQr());
  if (!mesa) {
    throw new NoEncontrado('Mesa');
  }
  return mesa;
}

export function listarMesas() {
  return mesasRepo.listarTodas();
}
