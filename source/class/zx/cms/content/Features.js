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

qx.Class.define("zx.cms.content.Features", {
  extend: qx.core.Object,

  construct() {
    throw new Error("Do not instantiate " + this.classname);
  },

  statics: {
    /** Map of the Feature instances used for given class names */
    __featuresByClassname: {},

    /**
     * Finds a feature for a given class, creating one if necessary and caching the result.
     *
     * If the class is a Feature, an instance is created; if the class has an annotation of
     * zx.cms.content.anno.Feature, the annotation's `featureClass` property can
     * give the name of a class otherwise SimpleFeature is used.
     *
     * @param clazz {String|Class} the class to obtain a Feature for
     * @return {zx.cms.content.IFeature} the feature instance (which is cached and reused)
     */
    getFeature(clazz) {
      if (typeof clazz == "string") {
        let tmp = qx.Class.getByName(clazz);
        if (!tmp) throw new Error(`Cannot find a class called ${clazz}`);
        clazz = tmp;
      }

      // Check the cache
      let feature =
        zx.cms.content.Features.__featuresByClassname[clazz.classname] || null;
      if (!feature) {
        // Is a feature?
        if (qx.Class.hasInterface(clazz, zx.cms.content.IFeature))
          feature = new clazz();
        else {
          let anno =
            qx.Annotation.getClass(clazz, zx.cms.content.anno.Feature)[0] ||
            null;
          if (anno) feature = new zx.cms.content.SimpleFeature(clazz);
        }

        if (!feature) {
          // Has an annotation
          let anno =
            qx.Annotation.getClass(clazz, zx.cms.content.anno.Feature)[0] ||
            null;
          let featureClazz = zx.cms.content.SimpleFeature;
          if (anno) {
            if (anno.getFeatureClass()) {
              featureClazz = qx.Class.getByName(anno.getFeatureClass());
              if (!featureClazz)
                throw new Error(
                  `Cannot find feature class ${anno.getFeatureClass()} referred to by annotation ${
                    anno.classname
                  } on ${clazz.classname}`
                );
            }
          }
          feature = new featureClazz(clazz);
        }

        zx.cms.content.Features.__featuresByClassname[clazz.classname] =
          feature;
      }

      return feature;
    }
  }
});
