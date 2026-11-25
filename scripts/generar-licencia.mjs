#!/usr/bin/env node
import crypto from 'node:crypto'

// ATENCIÓN: Esta clave secreta DEBE coincidir con la definida en src/main/license/licenseManager.js
const SECRET_KEY = 'BILLAR_POS_ZEROBYTE_2026_PINAYA_SECRETO'

const arg = process.argv[2]

if (!arg || !arg.trim()) {
  console.error('\n[Error] Debes proporcionar el Código de Identificación del Equipo.')
  console.error('Uso: node scripts/generar-licencia.mjs BP-XXXX-XXXX-XXXX\n')
  process.exit(1)
}

const machineCode = arg.trim().toUpperCase()

const hmac = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(machineCode)
  .digest('hex')
  .slice(0, 16)
  .toUpperCase()

const clave = `${hmac.slice(0, 4)}-${hmac.slice(4, 8)}-${hmac.slice(8, 12)}-${hmac.slice(12, 16)}`

console.log('\n======================================================')
console.log('       GENERADOR DE LICENCIAS — BILLAR POS')
console.log('       Desarrollado por: El_Zero_Byte')
console.log('======================================================')
console.log(` Código de Equipo : ${machineCode}`)
console.log(` Clave de Licencia: ${clave}`)
console.log('======================================================\n')
