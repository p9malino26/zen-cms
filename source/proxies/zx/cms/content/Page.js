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

  
 * @use(zx.cms.content.Piece)
  
 * @use(qx.data.Array)
  


  
 * @require(zx.io.persistence.anno.Property)
  
 * @require(zx.io.remote.anno.Property)
  
 * @require(zx.io.persistence.anno.Array)
  
 * @require(zx.utils.anno.Json)
  
 * @require(zx.server.anno.LastModified)
  
 * @require(zx.io.remote.anno.Method)
  

 */
qx.Class.define("zx.cms.content.Page", {
  extend: zx.io.persistence.Object,
  
    include: [ zx.cms.content.MPage ],
  

  construct(...vargs) {
    this.base(arguments, ...vargs);
    zx.io.remote.NetworkEndpoint.initialiseRemoteClass(zx.cms.content.Page);
  },

  properties: {
    
      title: {
         init: "Untitled Page", 
        
           check: "String", 
          nullable: false,
           event: "changeTitle", 
           apply: "_applyTitle", 
          
        
        "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
      },
    
      url: {
         init: "untitled-page", 
        
           check: "String", 
          nullable: false,
           event: "changeUrl", 
           apply: "_applyUrl", 
          
        
        "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
      },
    
      hero: {
         init: null, 
        
           check: "zx.cms.content.Piece", 
          nullable: true,
           event: "changeHero", 
           apply: "_applyHero", 
          
        
        "@": [new zx.io.persistence.anno.Property().set({ "embed": true }), new zx.io.remote.anno.Property()]
      },
    
      pieces: {
        
        
           check: "qx.data.Array", 
          nullable: false,
           event: "changePieces", 
           apply: "_applyPieces", 
           transform: "__transformPieces__P_88_0", 
        
        "@": [new zx.io.persistence.anno.Property().set({ "embed": true }), new zx.io.remote.anno.Property(), new zx.io.persistence.anno.Array().set({ "arrayType": zx.cms.content.Piece })]
      },
    
      layout: {
         init: null, 
        
           check: "String", 
          nullable: true,
           event: "changeLayout", 
           apply: "_applyLayout", 
          
        
        "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
      },
    
      cssClass: {
         init: "", 
        
           check: "String", 
          nullable: false,
           event: "changeCssClass", 
           apply: "_applyCssClass", 
          
        
        "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
      },
    
      decorators: {
        
        
           check: "qx.data.Array", 
          nullable: false,
           event: "changeDecorators", 
           apply: "_applyDecorators", 
          
        
        "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property()]
      },
    
      lastModified: {
        
        
           check: "Date", 
          nullable: true,
           event: "changeLastModified", 
           apply: "_applyLastModified", 
          
        
        "@": [new zx.io.persistence.anno.Property(), new zx.io.remote.anno.Property(), new zx.utils.anno.Json().set({ "public": true }), new zx.server.anno.LastModified().set({ "excluded": true })]
      },
    
  },

  members: {
    
      _applyTitle(value, oldValue) {
        // Nothing - to be overridden
      },
    
      _applyUrl(value, oldValue) {
        // Nothing - to be overridden
      },
    
      _applyHero(value, oldValue) {
        // Nothing - to be overridden
      },
    
      _applyPieces(value, oldValue) {
        // Nothing - to be overridden
      },
    
      _applyLayout(value, oldValue) {
        // Nothing - to be overridden
      },
    
      _applyCssClass(value, oldValue) {
        // Nothing - to be overridden
      },
    
      _applyDecorators(value, oldValue) {
        // Nothing - to be overridden
      },
    
      _applyLastModified(value, oldValue) {
        // Nothing - to be overridden
      },
    

    
      

      
        __transformPieces__P_88_0(value, oldValue) {
        if (oldValue) {
          oldValue.replace(value ? value : []);
          return oldValue;
        }

        return value;
      },
      
    
      
      "@save": [new zx.io.remote.anno.Method()],
      

      
        save() { 
          throw new Error("This object does not exist on the server yet, so remote method invocation is not possible");
        },
      
    
  }
});
