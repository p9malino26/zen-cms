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

qx.Class.define("zx.cms.content.AbstractRemoteControl", {
  extend: qx.core.Object,

  construct(uuid, elements) {
    this.base(arguments);
    this.__uuid = uuid;
    this.__elements = elements;
  },

  members: {
    __uuid: null,
    __elements: null,

    getUuid() {
      return this.__uuid;
    },

    getElements() {
      return this.__elements;
    },

    initialise() {
      // Nothing
    },

    propertyChanged(propertyName, value, oldValue) {
      this.warn(
        `Property ${propertyName} has changed but the change in value has not been processed because there is no implementation for it`
      );
    },

    /**
     * Helper method that applies css class changes to the elements
     *
     * @param {String?} value class(es) to add
     * @param {String?} oldValue class(es) to remove
     */
    _changeCssClass(value, oldValue) {
      let div = this.getElements()[0] || null;
      let classes = {};
      qx.lang.Array.fromCollection(div.classList).forEach(
        name => (classes[name] = true)
      );
      if (oldValue) oldValue.split(/\s+/).forEach(name => delete classes[name]);
      if (value) value.split(/\s+/).forEach(name => (classes[name] = true));
      div.className = Object.keys(classes).join(" ");
    }
  }
});
