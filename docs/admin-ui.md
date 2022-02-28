# The Administration User Interface

The Admin UI is yet to be written :( The intention is that it works as either a stand alone Qooxdoo app
or it is integrated into your own Control Panel application

Some CMSs will incorporate in place editing for every detail of the website within the page, but my
experience is that this is not always practical - for example, the widgets you need to superimpose on top
of the page often get in the way, or are quite simplistic.

The user interface required to edit and configure some of the widgets quickly become very complex, and
you end up with a large and sophisticated application to edit the website - but when this is supposed to be
done inline with the website, this means that a lot of code has to be injected into each page.

In reality, the only time that users actually want to edit a page interactively is when it comes to editing
the content, ie the rich text that they have written themselves. It would be quite easy to add an inline
editor that starts up when they click in the text (and there are a number of very lightweight editors
available open source), and to then quickly flash that change back to the server to update the database.

The Admin UI then, should by a Qooxdoo "Desktop" application that focuses on configuring and maintaining
the website structure, similar to any database backed application. The main part of the Admin UI could
be a tree of the documents in the database, and as the user browses between pages, the content page would
be displayed in an iframe (where in place editing would be available, just as it would be without the
Admin UI).

Because of the features provided by `incubator.qx.io.remote`, the objects in the CMS server would be
available in server, the Admin UI application, and the Thin Client application; edits made in one place
will be reflected in another.
