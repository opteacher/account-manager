const crypto = require('crypto')

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'opteacher' // Replace with your passphrase
  }
})

console.log('Public Key:', publicKey)
console.log('Private Key:', privateKey)

// encrypt the private key with a passphrase
const encrypt = crypto.privateEncrypt(
  privateKey,
  Buffer.from('This is a secret message')
)

console.log('Encrypted Private Key:', encrypt.toString('base64'))
