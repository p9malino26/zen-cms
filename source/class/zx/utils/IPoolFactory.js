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
