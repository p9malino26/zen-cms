/**
 * Interface for a class which provides encryption and decryption services
 * acroll the transmission medium used for Remote APIs
 */
qx.Interface.define("zx.io.api.crypto.IEncryptionMgr", {
  members: {
    /**
     *
     * @param {string} data Original data to encrypt
     * @returns {*} Encrypted data
     */
    encryptData(data) {},

    /**
     * @param {*} data Encrypted data to decrypt
     * @returns {string} Decrypted data
     */
    decryptData(data) {}
  }
});
