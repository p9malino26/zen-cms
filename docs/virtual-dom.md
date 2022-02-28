# Zen CMS, and JSX and the Virtual DOM

## Rendering complex DOM on the server (JSX and Virtual DOM)

When a Piece on the server renders HTML, it is output as a string which is sent to the client; this is
easy if the content to be output is something that can reasonably be output by a Nunjucks Template, and
in many cases this is perfectly acceptable. As mentioned above, the Piece is asked by the server to
populate a POJO JSON object which is passed to the pre-compiled Nunjucks Template to generate HTML.

The disadvantage of that approach is that the presentation layer is separated from the logic of the
code, and as the Piece becomes more complex it can become impractical to write the Nunjucks Template
to correctly implement the features provided by the code. Even though the rendering process in the
CMS provides for parts of the rendering to be overridden, this is no where near as rich as the facilities
provided by Object Orientation in classes; as the files on disk multiply it gets increasingly
harder to understand what's going on, and there is no debugger.

For more complex Pieces, the solution is to use the virtual DOM in `qx.html.*` - these classes work
with the JSX support of the Qooxdoo Compiler and the ObjectID system to allow you easily incorporate
DOM into your code, manipulate it on the fly, and then render it as an HTML string as part of the
web page.

This lets you write code like:

```
    let body = this.getBody();
    body.add(<h1>Welcome to the New Website</h1>);
    body.add(
        <div class="content">
          <p>This website is for internal use by authorised personnel only
          <img src="/qx/theme/images/signon_transparent.gif" alt="Sign On"/>
        </div>
      );
```

## Connecting client DOM to the server DOM

Typically, the client will run some javascript to connect to the DOM that has been rendered by the
server - the code will find the DOM elements, one by one using Sizzle or native APIs like
`document.getElementById`.

This method works find for small pieces of HTML, but again does not scale well - it also means that the
code on the client has a lot of fragile boilerplate to reconnect to the DOM objects, and typically will
mean that code is also repeated between the client and the server.

Wouldn't it be great if you could write a class just once, write the DOM just once, and have the
same code "just work" on client and server?

If you use the Qooxdoo ObjectID system to create your JSX objects, you can instantiate the same class on
the server or the client - the difference is that the version on the server will create virtual DOM elements
which are converted into a string and returned by the server as part of the page's HTML; but the version
that is loaded on the client will connect to those DOM elements already on the page, ie the DOM elements which
have been parsed by the browser.

This lets you write code like:

```
    let body = this.getBody();
    body.add(<h1>Welcome to the New Website</h1>);
    body.add(
        <div class="content">
          <p>This website is for internal use by authorised personnel only
          <img src="/qx/theme/images/signon_transparent.gif" alt="Sign On"/>
        </div>
      );
    body.add(this.getQxObject("form"));
  },

  doSomething() {
    let email = this.getQxObject("edtEmail").getValue();
    let password = this.getObject("edtPassword").getValue();
    // Do Something here
  },

  _createQxObjectImpl(id) {
    switch(id) {
    case "form":
      let form = <form method="post" action="#"></form>;
      form.add(this.getQxObject("edtEmail"));
      form.add(this.getQxObject("edtPassword"));
      form.add(this.getQxObject("btnLogin"));
      form.addListener("submit", evt => {
        evt.preventDefault();
      });
      return form;
```

That class snippet above is for creating the DOM on the server, and also for managing the DOM on the client -
there is no boiler plate required.

### Why have server rendering?

You could just write code that creates DOM on the fly on the client, while this will end up with a perfectly
functional presentation (which does not require boilerplate), the code cannot start adding DOM until after the page
has finished loading. This will cause a very visible delay, during which your page is entirely blank, before the
page flashes as the new DOM comes into existence and changes the entire layout of the page.

## Building User Interfaces

Once you have the general principal of rendering components in this way, the next logical step is to develop
more complex user interface components; you can write forms or other snippets of HTML using just the virtual
DOM, EG using `<input...>` directly in your code and manipulating the result, but the real advantage of being
able to package DOM with code is that it is makes it very simple to build blocks of reusable functionality.
