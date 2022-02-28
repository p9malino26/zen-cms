/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2022 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

qx.Mixin.define("zx.ui.editor.MField", {
  properties: {
    /**
     * Validation function; can be `async` and returns null if valid, else returns a string which is the validation
     * error message.  For legacy reasons (see Qooxdoo `qx.ui.form.validation.Manager`), if `qx.core.ValidationError`
     * is raised, that is also considered to be the validation message
     */
    validator: {
      init: null,
      nullable: true,
      check: "Function",
      event: "changeValidator"
    }
  },

  members: {
    /**
     * Validates this field, setting the `invalidMessage` and `valid` properties
     *
     * @return {Boolean} whether this field is valid
     */
    async validateField() {
      let fn = this.getValidator();
      let message = null;
      if (this.isRequired() && this.isEmptyField()) {
        message = this.getRequiredInvalidMessage();
      }
      if (message === null && fn) {
        try {
          message = await fn(this);
        } catch (ex) {
          if (ex instanceof qx.core.ValidationError) {
            if (ex.message && ex.message != qx.type.BaseError.DEFAULTMESSAGE)
              message = ex.message;
            else message = ex.getComment();
          } else {
            throw ex;
          }
        }
      }
      this.setInvalidMessage(message);
      this.setValid(!message);

      return this.getValid();
    },

    /**
     * Detects whether this field is empty
     *
     * @returns {Boolean}
     */
    isEmptyField() {
      if (qx.Class.hasInterface(this.constructor, qx.ui.core.ISingleSelection))
        return this.getSelection().length > 0;

      if (
        qx.Class.hasInterface(this.constructor, qx.data.controller.ISelection)
      )
        return this.getSelection().getLength() > 0;

      let value = this.getValue();
      if (value === null || value === undefined) return true;
      if (typeof value == "string" && value.length == 0) return true;
      return false;
    }
  }
});
