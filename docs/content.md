# Rendering HTML on the Server and the Client

## Content on the server ("Pages" and "Pieces")

By "Content on the server", we mean that the data structures which are used to store the content of
each page - but this is much more than just rich text edited by the user, it also includes HTML and
code which is provided by code on the server, all of which is arranged on the page by the user.

Zen CMS uses the terminology "Page" and "Piece", where a Page (`zx.cms.content.Page`)
contains multiple Piece's (`zx.cms.content.Piece`), and each Piece can be used to render HTML
onto the page as the client requests it from the server.

The most basic type of Piece would just be a single piece of rich text hand edited by an end user,
but a Piece can also contain a list of other Pieces (eg `zx.cms.content.ContainerPiece`,
which renders each of _its_ pieces into some kind of layout), or a Piece could be some kind of widget
like a Blog Listing, a Twitter Feed, etc.

Note that although it might be possible to create your own custom implementation of a Page which
doesnt use Pieces at all, this is not the intention - in Zen CMS, everything is a Piece which
is assembled together at run time.

## Selecting a template to render content on the server ("Controllers" and "Templates")

In order to output a Piece as HTML, a Nunjucks Template is selected for that Piece and then the
Template is executed to produce an HTML string.

To select the correct Nunjucks Template, a Controller (`zx.cms.content.PieceController`) is
created for that particular class of Piece, and then the Controller is asked to provide the Template.
The default implementation of Controller will work for most situations, because it follows a set of rules
to search for the a Template file on disk, based on things like the class name of the Piece.

The searching process starts in the website's Theme directory, and progressively falls back through
resources and directories in the website until it ends up with a default implementation that can be
provided by the code that implemented the Piece. This means that a code author of a widget, say
`myWidgets.BlogPostPiece`, can provide a default implementation of a Template - but the website's
Theme can override the Template for that `myWidgets.BlogPostPiece`; and if the Theme is shared
between several websites, the individual websites can choose to override the Theme's override of
the Template.

## Rendering content on the client ("Features")

Once a Template is selected, it is compiled and cached. Everytime the server is asked to provide
content to the client and render a Piece, it first selects a Feature (`zx.cms.content.Feature`)
which is a small piece of code that knows how to render the Piece on the server _and on the client_.

Wait a minute - if we're rendering the Piece on the server, we're converting the Piece into HTML
and delivering it as a string. So why do we need to render _on the client_?

If your Piece just outputs HTML (eg it's just a piece of rich text typed in by the user, or perhaps
it's a simple list of blog postings), then there isn't actually anything to do on the client - once
that piece of user-edited content has been delivered, the job is done.

Rendering on the client is a step that has to take place if there is some kind of initialisation
on the browser that needs to be done when the widget appears - i.e. typical AJAX-style behaviour.

For example, let's say that your list of blog posts isn't quite so simple, and that when a user
clicks the list you connect to the server to get the content for that one blog entry and update
the browser DOM to show it. The code that makes this AJAX magic happen will be written as an
ordinary Qooxdoo class, is compiled by the Qooxdoo compiler, and is delivered to the browser along
with every web page.

A Feature is a small piece of code that controls how this happens on the server and the client;
generally speaking, the default implementation is enough but a Piece class can change this by
using the `zx.cms.content.anno.Feature` annotation.

Crucially, a Feature's implementation should be capable of compiled by the Qooxdoo compiler for use
on the browser _without_ dragging in lots of dependences from the server.
