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


/**
 * Mixin for objects which can be persisted.  You do not have to use this mixin, it's just here
 * as a helpful utility - but your classes must implement `zx.io.persistence.IObject`
 *
 */
qx.Mixin.define("zx.io.persistence.MObject", {
  destruct() {
    if (this.__controller) this.__controller.forgetObject(this);
  },

  events: {
    dataLoadComplete: "qx.event.type.Event"
  },

  members: {
    /** @type{zx.io.persistence.Controller} the controller that created this object */
    __controller: null,

    /** @type{bool} true when the object is fully loaded from the database */
    __dataLoadComplete: false,

    /**
     * @Override
     */
    receiveDataNotification(key, data) {
      switch (key) {
        case zx.io.persistence.IObjectNotifications.CREATED:
          this.__controller = data;
          return;

        case zx.io.persistence.IObjectNotifications.DATA_LOAD_COMPLETE:
          this.__dataLoadComplete = true;
          this.fireEvent("dataLoadComplete");
          return;
      }
    },

    /**
     * Returns true if the object is fully loaded
     *
     * @returns {Boolean}
     */
    isDataLoadComplete() {
      return this.__dataLoadComplete;
    }
  }
});
