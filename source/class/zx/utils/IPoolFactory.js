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
 * Factory for zx.utils.Pool
 */
qx.Interface.define("zx.utils.IPoolFactory", {
  members: {
    /**
     * Creates a new poolable entity
     *
     * @returns {*}
     */
    async createPoolableEntity() {},

    /**
     * Destroys a poolable entity when it is no longer needed
     *
     * @param {*} entity a value previously returned by `create`
     */
    async destroyPoolableEntity(entity) {}
  }
});
