/**
 * This proxy class is generated by `zx.io.remote.proxy.ClassWriter` and should not be edited manually
 * because it will be overwritten.
 *
 * To regenerate, use `zx create-proxies`, and the CMS server will automatically do the same during startup.
 *
 * Copyright and License - this file is copyright and licensed under the terms provided by the copyright owner, 
 * which presumably match the owner and license terms of the original source file.  It is your responsibility 
 * to determine ownership and terms.
 *

  


  
 * @require(zx.io.remote.anno.Method)
  

 */
qx.Class.define("zx.server.auth.LoginApiAdmin", {
  extend: zx.server.Object,
  

  construct(...vargs) {
    this.base(arguments, ...vargs);
    zx.io.remote.NetworkEndpoint.initialiseRemoteClass(zx.server.auth.LoginApiAdmin);
  },

  properties: {
    
  },

  members: {
    

    
      
      "@getUserByUuid": [new zx.io.remote.anno.Method()],
      

      
        getUserByUuid() { 
          throw new Error("This object does not exist on the server yet, so remote method invocation is not possible");
        },
      
    
      
      "@search": [new zx.io.remote.anno.Method()],
      

      
        search() { 
          throw new Error("This object does not exist on the server yet, so remote method invocation is not possible");
        },
      
    
      
      "@createImpersonateCode": [new zx.io.remote.anno.Method()],
      

      
        createImpersonateCode() { 
          throw new Error("This object does not exist on the server yet, so remote method invocation is not possible");
        },
      
    
      
      "@createUser": [new zx.io.remote.anno.Method()],
      

      
        createUser() { 
          throw new Error("This object does not exist on the server yet, so remote method invocation is not possible");
        },
      
    
      
      "@setUserPassword": [new zx.io.remote.anno.Method()],
      

      
        setUserPassword() { 
          throw new Error("This object does not exist on the server yet, so remote method invocation is not possible");
        },
      
    
      
      "@deleteUser": [new zx.io.remote.anno.Method()],
      

      
        deleteUser() { 
          throw new Error("This object does not exist on the server yet, so remote method invocation is not possible");
        },
      
    
  }
});
