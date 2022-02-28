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

qx.Class.define("zx.data.IndexedArray", {
  extend: qx.data.Array,

  /**
   * Constructor
   *
   * @param {Object[]|qx.data.Array?} src initial value for the array contents
   */
  construct(src) {
    this.base(arguments);
    this.__lookup = {};
    if (src) src.forEach(item => item && this.add(item));

    this.addListener("change", evt => {
      let data = evt.getData();
      let keyGenerator = this.getKeyGenerator();

      if (data.removed)
        data.removed.forEach(item => {
          let key = keyGenerator ? keyGenerator(item) : item.toHashCode();
          delete this.__lookup[key];
        });

      if (data.added)
        data.added.forEach(item => {
          let key = keyGenerator ? keyGenerator(item) : item.toHashCode();
          this.__lookup[key] = item;
        });
    });
    this.regenerateLookup();
  },

  properties: {
    /** Function that, when given an object, can return a unique and repeatable identifier */
    keyGenerator: {
      init: null,
      nullable: true,
      check: "Function",
      event: "changeKeyGenerator",
      apply: "_applyKeyGenerator"
    }
  },

  members: {
    /** @type{Map<String,Object>} lookup, the key is returned by `keyGenerator`, value is the array item */
    __lookup: null,

    /**
     * Apply for `keyGenerator`
     */
    _applyKeyGenerator(value, oldValue) {
      this.regenerateLookup();
    },

    /**
     * Regenerates the lookup
     */
    regenerateLookup() {
      this.__lookup = {};

      let keyGenerator = this.getKeyGenerator();
      this.forEach(item => {
        let key = this.getKey(item);
        if (this.__lookup[key])
          throw new Error(`Duplicate entry found in IndexedArray, key=${key}`);
        this.__lookup[key] = item;
      });
    },

    /**
     * Safely adds a new item, ignoring null/undefined values and removing conflicting
     * values
     *
     * @param {*} item
     */
    add(item) {
      if (item === null || item === undefined) return null;
      let key = this.getKey(item);
      let current = this.__lookup[key];
      if (current === item) return;
      if (current) this.remove(current);
      this.push(item);
    },

    /**
     * Looks up an item using the key
     *
     * @param {String} key to lookup
     * @returns {Object?} null if not found
     */
    lookup(key) {
      return this.__lookup[key] || null;
    },

    /**
     * Removes an item with a specific key
     *
     * @param {String} key
     */
    removeByKey(key) {
      let item = this.__lookup(key);
      if (item) this.remove(item);
    },

    /**
     * Determines the key for an item
     *
     * @param {*} item
     * @returns {String}
     */
    getKey(item) {
      let keyGenerator = this.getKeyGenerator();
      let key = null;
      if (keyGenerator) key = keyGenerator(item);
      if (!key && item instanceof qx.core.Object) key = item.toHashCode();
      if (qx.core.Environment.get("qx.debug")) this.assertTrue(!!key);
      return key;
    },

    /**
     * @Override
     */
    contains(item) {
      let key = this.getKey(item);
      return !!this.__lookup[key];
    },

    /**
     * @Override
     */
    includes(item) {
      return this.contains(item);
    },

    /**
     * @Override
     */
    push(...itemsToAdd) {
      itemsToAdd = itemsToAdd.filter(item => item && !this.contains(item));
      this.base(arguments, ...itemsToAdd);
    },

    /**
     * @Override
     */
    splice(startIndex, amount, ...itemsToAdd) {
      let result = this.base(arguments, startIndex, amount);
      itemsToAdd.forEach(item => item && this.add(item));
    },

    /**
     * @Override
     */
    unshift(...itemsToAdd) {
      itemsToAdd = itemsToAdd.filter(item => item && !this.contains(item));
      this.base(arguments, ...itemsToAdd);
    },

    /**
     * @Override
     */
    setItem(index, item) {
      let oldItem = this.getItem(index);
      if (oldItem === item) return;

      if (this.contains(item))
        throw new Error(
          `Cannot create duplicate in IndexedArray.setItem, index=${index}, item=${item}`
        );
      this.base(arguments, index, item);
    },

    /**
     * @Override
     */
    insertAt(index, item) {
      if (this.contains(item))
        throw new Error(
          `Cannot create duplicate in IndexedArray.insertAt, index=${index}, item=${item}`
        );
      this.base(arguments, index, item);
    },

    /**
     * @Override
     */
    insertBefore(index, item) {
      if (this.contains(item))
        throw new Error(
          `Cannot create duplicate in IndexedArray.insertBefore, index=${index}, item=${item}`
        );
      this.base(arguments, index, item);
    },

    /**
     * @Override
     */
    insertAfter(index, item) {
      if (this.contains(item))
        throw new Error(
          `Cannot create duplicate in IndexedArray.insertAfter, index=${index}, item=${item}`
        );
      this.base(arguments, index, item);
    },

    /**
     * @Override
     */
    append(...itemsToAdd) {
      itemsToAdd = itemsToAdd.filter(item => item && !this.contains(item));
      this.base(arguments, ...itemsToAdd);
    }
  }
});
