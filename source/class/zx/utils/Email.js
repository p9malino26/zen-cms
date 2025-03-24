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

/**
 * This class provides helper functions for working with emails.
 * 
 * Acknowledgements:
 * This code is based on https://github.com/manishsaraan/email-validator
*/
qx.Class.define("zx.utils.Email", {
  statics: {
    __EMAIL_VALIDATION_EXPR: /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/,
    
    /**
     * Validates the format of an email address.  Does not check if it exists, only if it is a valid format.
     * 
     * @param {string} email 
     * @returns {boolean}
     */
    validate(email) {
      if (!email) throw new Error("Email is required");

      var emailParts = email.split("@");

      if (emailParts.length !== 2) return false;

      var account = emailParts[0];
      var address = emailParts[1];

      if (account.length > 64) return false;
      else if (address.length > 255) return false;

      var domainParts = address.split(".");

      if (
        domainParts.some(function (part) {
          return part.length > 63;
        })
      )
        return false;

      return zx.utils.Email.__EMAIL_VALIDATION_EXPR.test(email);
    }
  }
});
