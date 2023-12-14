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

qx.Class.define("zx.app.pages.RemoteControlProxy", {
  extend: zx.io.persistence.Object,
  "@": [zx.io.remote.anno.Class.NOPROXY],

  members: {
    /**
     * Called to tell the remote that a property has changed
     */
    "@propertyChanged": zx.io.remote.anno.Method.DEFAULT,
    propertyChanged(uuid, propertyName, value, oldValue) {
      let remoteControl = qx.core.Init.getApplication().findRemoteControl(uuid);
      if (remoteControl) {
        remoteControl.propertyChanged(propertyName, value, oldValue);
      }
    }
  }
});
