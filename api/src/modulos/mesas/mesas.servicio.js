import { randomBytes } from 'node:crypto';
import { conTransaccion } from '../../db/transaccion.js';
import { Conflicto, NoEncontrado } from '../../shared/errores.js';
import { ESTADOS_MESA } from '../../shared/constantes.js';
import { firmarTokenComensal } from '../../shared/tokens.js';
import * as mesasRepo from './mesas.repositorio.js';

const BYTES_TOKEN_QR = 24;

export function generarTokenQr() {
  return randomBytes(BYTES_TOKEN_QR).toString('base64url');
}

export async function obtenerMesaPorToken(tokenQr) {
  const mesa = await mesasRepo.buscarPorToken(tokenQr);
  if (!mesa) {
    throw new NoEncontrado('Mesa');
  }
  return { numero: mesa.numero, estado: mesa.estado };
}

async function obtenerOAbrirSesion(cliente, mesa) {
  const idSesionAbierta = await mesasRepo.buscarSesionAbierta(cliente, mesa.idMesa);
  if (idSesionAbierta) {
    return idSesionAbierta;
  }
  const idSesionNueva = await mesasRepo.abrirSesion(cliente, mesa.idMesa);
  await mesasRepo.actualizarEstado(cliente, mesa.idMesa, ESTADOS_MESA.OCUPADA);
  return idSesionNueva;
}

export async function registrarComensal({ tokenQr, nombreAlias }) {
  return conTransaccion(async (cliente) => {
    // FOR UPDATE: dos comensales que escanean a la vez comparten la misma sesión de mesa.
    const mesa = await mesasRepo.bloquearPorToken(cliente, tokenQr);
    if (!mesa) {
      throw new NoEncontrado('Mesa');
    }
    if (mesa.estado === ESTADOS_MESA.INACTIVA) {
      throw new Conflicto('MESA_INACTIVA', 'Esta mesa no está atendiendo en este momento');
    }

    const idSesionMesa = await obtenerOAbrirSesion(cliente, mesa);
    const idComensal = await mesasRepo.insertarComensal(cliente, { idSesionMesa, nombreAlias });

    return {
      token: firmarTokenComensal({ idComensal, idSesionMesa, idMesa: mesa.idMesa }),
      comensal: { idComensal, nombreAlias },
      mesa: { numero: mesa.numero },
    };
  });
}

export async function regenerarQr(idMesa) {
  const mesa = await mesasRepo.actualizarToken(idMesa, generarTokenQr());
  if (!mesa) {
    throw new NoEncontrado('Mesa');
  }
  return mesa;
}

export function listarMesas() {
  return mesasRepo.listarTodas();
}
