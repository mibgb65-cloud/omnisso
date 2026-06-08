import { generateKeyPairSync } from 'node:crypto'

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicExponent: 0x10001
})

const jwk = privateKey.export({ format: 'jwk' })

jwk.alg = 'RS256'
jwk.ext = true
jwk.key_ops = ['sign']

console.log(JSON.stringify(jwk))
