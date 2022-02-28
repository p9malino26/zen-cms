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
 * ClassRefIo and ClassIo share this interface
 */
qx.Interface.define("zx.io.persistence.IIo", {
  members: {
    /**
     * Reads JSON data and populates an object, creating it if required
     *
     * @param ctlr {Controller} the controller
     * @param json {Object} the JSON data to load
     * @return {qx.core.Object} the populated object
     */
    async fromJson(ctlr, json) {},

    /**
     * Serializes the object into JSON
     *
     * @param ctlr {Controller} the controller
     * @param obj {qx.core.Object} the object to serialize
     * @return {Object} serialized JSON object
     */
    async toJson(ctlr, obj) {}
  }
});
