/**
 * Various utilities for working with APIs
 *
 * As rule, APIs can be defined by an interface, where that interface is named
 * in the form of "package.IName".  The name of the API is then "package.Name",
 * and server and client APIs can be instantiated by the server and client
 * respectively
 *
 * The `zx.io.api.server.GenericServerApiProxy` class uses this utility to automatically
 * define server APIs
 */
qx.Class.define("zx.io.api.ApiUtils", {
  extend: qx.core.Object,

  statics: {
    /**
     * Returns the API name from the interface
     */
    getApiNameFromInterface(apiInterface) {
      let match = apiInterface.name.match(/^(.*)\.I([^.]+)$/);
      let package = match[1];
      let name = match[2];
      return package + "." + name;
    },

    /**
     * Returns the method names implemented by the API
     */
    getMethodNamesFromInterface(apiInterface) {
      let ifcs = qx.Interface.flatten(apiInterface);
      let methods = {};
      for (let ifc of ifcs) {
        for (let name of Object.keys(ifc.$$members)) {
          let startChar = name.charAt(0);
          if (startChar !== "_" && startChar !== "$") {
            methods[name] = true;
          }
        }
      }
      methods = Object.keys(methods);
      methods.sort();
      return methods;
    }
  }
});
