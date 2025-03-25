/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

const crypto = require("crypto");
const fs = require("fs");

/**
 * Handles public private keys, with signing and verifying
 */
qx.Class.define("zx.utils.PublicPrivate", {
  extend: qx.core.Object,

  members: {
    /** @type{crypto.PrivateKey} the private key */
    __privateKey: null,

    /** @type{crypto.PublicKey} the public key */
    __publicKey: null,

    /**
     * Loads the private key
     *
     * @param {String} privateFile the file containng the private key
     */
    async init(privateFile) {
      const privateKeyData = await fs.promises.readFile(privateFile, "utf8");
      this.__privateKey = crypto.createPrivateKey({
        key: privateKeyData,
        format: "pem"
      });

      this.__publicKey = crypto.createPublicKey({
        key: this.__privateKey,
        format: "pem"
      });
    },

    /**
     * Signs the message data
     *
     * @param {Buffer} msgData
     * @returns {Buffer}
     */
    sign(msgData) {
      let signature = crypto.sign(null, msgData, this.__privateKey);
      return signature;
    },

    /**
     * Verifies the signature
     *
     * @param {Buffer} msgData
     * @param {Buffer} signature
     * @returns {Boolean}
     */
    verify(msgData, signature) {
      return crypto.verify(null, msgData, this.__publicKey, signature);
    }
  }
});
