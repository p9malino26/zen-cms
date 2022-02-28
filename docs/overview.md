# Zen [and the art of] CMS (ZX) - Overview

The Zen CMS project is a complete server infrastructure which is 100% Full Stack Javascript, based
on the Qooxdoo development framework. Out of the box, it provides:

- a Content Management Service (CMS)
- an Admin UI for end users to manage the website with in place editing
- Back end support for completely theming/skinning your website based on the popular Nunjucks library
- No-SQL database abstraction with support for simple file based and MongoDB storage
- CLI tool to run and administer the server

When developing custom application code based on Zen CMS, the framework provides a new set of features
that reduce the development time of full stack websites:

- A new client platform called "Thin Client", where lightweight objects backed by HTML (using JSX) can
  be rendered on the server or client, but with a single source code
- Transparent Client/Server I/O, where methods and properties can be accessed regardless of whether they
  are on the server or the client - the framework will take care of copying data and remote invocation
- Automatic Database I/O, where objects can be serialised into the database with nothing more than a couple
  of annotations

A website in ZX's terms can be broken down into these areas:

- The content on the server
- How server content is rendered onto the client
- How server code syncs with client content
- The content on the client and how it talks to the server
- The styling of the website
- The database that backs the CMS
- A Qooxdoo Desktop application that is used to edit the content and administer the CMS website
- One or more Qooxdoo "Desktop" applications

## Getting Started

If you want to dive in and create an empty CMS website, there are tools which integrate with
the `qx` command line tool to help you get started really quickly. Try this:

```
$ qx create myWebApp -I                             # Creates a new Qooxdoo application
$ cd myWebApp
$ qx package install qooxdoo/zx                # Adds the CMS library
$ qx cms install                                    # Configures a bare-bones CMS
$ qx cms create-theme themes.MyWebTheme             # Creates a theme
$ qx cms create-page samples.html 'Sample Styles'   # Creates a page for sample styles
$ qx compile                                        # Compiles your CMS app
$ qx run                                            # Starts the CMS web server
```

## Content on the server, and how to render it

The content on the server consists of Pages, each of which contain one or more Pieces - where
a Piece could be rich text entered by the user, or a widget like a blog listing.

Using Nunjucks Templates, code called Controllers and Features are used to convert these Pieces
into HTML that is sent back to the browser as part of the request for a web page.

[Read more about content and how its rendered](content.md)

## Running code on the browser ("Thin Client" and other applications)

Most modern web sites use Javascript to interact with the user, even if it is to a very small degree
such as displaying an interactive form, or making an image slider. The Zen CMS introduces a
concept of "Thin Client", which is code that is compiled from your normal development codebase, allowing
you to use the exact same code on both the server and browser.

[Read more about Thin Client and other applications](applications.md)

## Virtual DOM and more complex rendering

With more complex Pieces, using Nunjucks Templates to render HTML to the client is not ideal - it creates
a separation between design and implementation that works well for simple structures, but complex code
requires complex presentation, and the two are often so intertwined that they are to all intents and purposes
the same thing.

By using JSX and Qooxdoo's Virtual DOM, your Pieces can work with whatever method suits you best. The Virtual
DOM works on the client also, and will provide all of the boiler plate plumbing that attaches to the
DOM that is in the client.

[Read more about JSX and the Virtual DOM](virtual-dom.md)

## Light weight user interfaces ("Thin Client UI")

While content based websites can _include_ a Qooxdoo Desktop application, there are a number of occasions where
you need a very small piece of functionality but a Qooxdoo Desktop application is just too big or not appropriate
for other reasons.

Imagine for example a Twitter feed that you wanted to include into part of a page, or a signup form, or a
simple set of email preferences. If your user is unlikely to need to run a full application (or perhaps
never needs to), then starting a Qooxdoo Desktop app for any those purposes is going to be slow and there
will be complications when it comes to integrating the application into a tiny piece of the web page.

Qooxdoo's [JSX and the Virtual DOM](virtual-dom.md) feature provides a mechanism to define tiny fragments of
DOM and associated functionality, and share that between server and browser. While this is an essential
foundation, there are no widgets or high-level functionality.

The Zen CMS includes basic widgets which are modelled on the Google Materials UI styling, providing
functionality such as text input fields, checkboxes, buttons, etc

[Read more about CMS Thin Client UI](thin-client-ui.md)

## Theming the website

Obviously every website has its own unique theme, and the CMS provides this as a combination of code and
resources that are easily edited by non-coders and can be overridden within the website itself.

[Read more about CMS Theming](theming.md)

## The database

The CMS uses No-SQL, document based storage of JSON objects, backed by a choice of database implementation -
you can use a simple, hand editable files, or use NeDB, or full-blown MongoDB.

[Read more about CMS Database](database.md)

## Directory Layout

The CMS serves files from a specific directory, called `./website` by default, and also stores some special
state and database files.

[Read more about the Directory Layout](directories.md)

## Administration User Interface

The CMS needs a user interface to allow it to be edited

[Read more about CMS Admin User Interface](admin-ui.md)
