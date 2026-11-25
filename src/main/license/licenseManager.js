import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { app } from 'electron'

// ATENCIÓN: Esta clave secreta DEBE coincidir exactamente con la usada en scripts/generar-licencia.mjs
const SECRET_KEY = 'BILLAR_POS_ZEROBYTE_2026_PINAYA_SECRETO'

export function getMachineCode() {
  let rawId = ''

  if (process.platform === 'win32') {
    try {
      const output = execSync(
        'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      )
      const match = output.match(/MachineGuid\s+REG_SZ\s+([A-Fa-f0-9-]+)/i)
      if (match && match[1]) {
        rawId = match[1].trim()
      }
    } catch {
      // Fallback a características del sistema operativo en caso de fallo
    }
  }

  if (!rawId) {
    const cpuModel = os.cpus()[0]?.model || 'cpu'
    rawId = `${os.hostname()}-${os.platform()}-${os.arch()}-${cpuModel}`
  }

  const hash = crypto.createHash('sha256').update(rawId).digest('hex').toUpperCase().slice(0, 12)
  return `BP-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`
}

export function generarClaveEsperada(machineCode) {
  const hmac = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(String(machineCode).trim().toUpperCase())
    .digest('hex')
    .slice(0, 16)
    .toUpperCase()

  return `${hmac.slice(0, 4)}-${hmac.slice(4, 8)}-${hmac.slice(8, 12)}-${hmac.slice(12, 16)}`
}

export function getLicensePath() {
  return path.join(app.getPath('userData'), 'license.key')
}

export function verificarLicencia() {
  const machineCode = getMachineCode()
  const licensePath = getLicensePath()
  let activa = false

  if (fs.existsSync(licensePath)) {
    try {
      const contenido = fs.readFileSync(licensePath, 'utf8').trim().toUpperCase()
      const claveEsperada = generarClaveEsperada(machineCode)
      const bufContenido = Buffer.from(contenido)
      const bufEsperada = Buffer.from(claveEsperada)

      if (
        bufContenido.length === bufEsperada.length &&
        crypto.timingSafeEqual(bufContenido, bufEsperada)
      ) {
        activa = true
      }
    } catch {
      activa = false
    }
  }

  return { activa, machineCode }
}

export function activarLicencia(claveIngresada) {
  const clave = String(claveIngresada || '')
    .trim()
    .toUpperCase()
  const machineCode = getMachineCode()
  const claveEsperada = generarClaveEsperada(machineCode)

  const bufClave = Buffer.from(clave)
  const bufEsperada = Buffer.from(claveEsperada)

  if (bufClave.length === bufEsperada.length && crypto.timingSafeEqual(bufClave, bufEsperada)) {
    fs.writeFileSync(getLicensePath(), clave, 'utf8')
    return { activa: true, machineCode }
  }

  throw new Error('Clave de activación inválida para este equipo.')
}
