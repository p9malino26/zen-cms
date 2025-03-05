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
 * This interface is optional, but if implemented it allows the object to receive
 * notifications
 */
qx.Interface.define("zx.io.persistence.IObjectNotifications", {
  statics: {
    /** Sent after creation, data is the controller */
    CREATED: "created",

    /** Sent after loading */
    DATA_LOAD_COMPLETE: "dataLoadComplete",

    /** Sent before serialising into JSON */
    BEFORE_WRITE_TO_JSON: "beforeWriteToJson",

    /** Sent after serialising into JSON */
    WRITE_TO_JSON_COMPLETE: "writeToJsonComplete"
  },

  members: {
    /**
     * Called with notifications from the controller
     *
     * @param key {String} the event type
     * @param data {Object} data relevant to the key value
     */
    async receiveDataNotification(key, data) {}
  }
});
