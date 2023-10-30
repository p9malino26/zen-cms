# Theming

Themes allow a complete set of styling to be swapped in and out for a website, and can exist either as an integrated
part of your source code, with assets etc inside your `source/resources` directory and any code in your `source/class`
directory, or a theme can use the default implementation for code and use a directory inside your website inside the
special `website/themes/` directory.

Every theme needs a name, which must be a typical Javascript identifier, like "website.MyTheme" or
"com.mycorp.cms.themes.MyTheme" - the theme name is used to identify classes to load and the directory to search
for.

_Most users do not need to define a Theme class_ - doing so will allow you to have additional, fine grained control
of the resources and path names, but especially if you are creating a CMS website from scratch you will find it simpler
to not create one.

The assets which make up your theme can be either in your `source/resources` directory, or in the resources directory
of one of your packages, or in the `website/themes/<themename>` directory. The only thing you need to consider is that
if your assets are stored in a `resources` directory, you must declare an `@asset(...)` JSDOC comment somewhere to
make sure that the resources are compiled (ie just like any other kind of resource).

While this allows themes to be distributed as packages which can be installed with `qx package install...`, for one-off
themes for a single website, it's simpler to just pick a name like `myproject.MyWebsiteTheme` and store files in
a directory under `website/themes` (eg in `website/themes/myproject/MyWebsiteTheme`)

## SCSS / SASS files

All SCSS files are automatically compiled into .css - and following the SCSS convention, any file which begins
with an underscore is a file to be included and not compiled. You can also include files which are part of
a library, using the `@import "zx:path/to/file"` syntax in your SCSS file - however, you must have made sure
that file is included in the resources of your application (this is an example of why you might create a
Javascript class for your theme, so that you can add a `@asset(path/to/file)` in the header).

However, there is a difference depending on where your .scss file is located - if it is in your _resources_,
then the compiler will compile it as part of `qx compile`, and then the only file still available is the
generated .css file.

If your file is inside the `website/themes/<themename>` directory, the CMS runtime will monitor that directory for
changes to .scss files and recompile as necessary - at runtime. Normally, the Qooxdoo compiler will automatically
compile your .scss to .css, but that means that the original .scss file is not available in the resources. This is
fine if you only use your own .scss files, but if you want to use .scss files from Qooxdoo (eg the Materials
UI theme) you will need to modify your `compile.json` to have:

```
  "sass": {
    "compiler": "latest",
    "copyOriginal": true
  }
```

## Finding Nunjucks Templates

When the server renders the Pieces on a Page, it uses the Controllers [described in content.md](content.md) to
locate a Nunjucks Template for each Piece and then arranges for that Template to output the content for that Piece.

If the Pieces on a Page are the content (eg the text or widgets that are presented to the user to read), then the
Page also needs to be rendered with all the extra HTML that form the navigation, the header, the footer, etc.

Pages work in the same way as Pieces, in that they are rendered by the `zx/cms/content/Page.html` template,
and this too can be overridden by the Theme.

Note that each Pieces and the Page need a Template, and the rendering process will look in a series of different
directories to find the Template; these directories include the theme directory and end up in the resources of the
CMS server application.

In each directory, the template name is a flattened classname - for example, if a theme wanted to provide its own
layout for the `zx.cms.content.ContentPiece` class, then it could create a file called
`zx.cms.content.ContentPiece.html` inside your theme directory (eg `website/website/themes/myproject.MyWebsiteTheme/zx.cms.content.ContentPiece.html`)

The directories which are searched for a template file are:

- `_cms/templates/zx.cms.content.ContentPiece.html`
- `website/themes/myproject.MyWebsiteTheme/zx.cms.content.ContentPiece.html`
- The resources directory for the theme, eg `resources/myproject/MyWebsiteTheme/zx.cms.content.ContentPiece.html`
- The resources directory root, eg `resources/zx/cms/content/ContentPiece.html`

Note that the last place to be searched for is in the resources for Zen CMS itself, where the files are stored in
a tree - EG the CMS resource directory `zx/cms/content/ContentPiece.html` - but everywhere else a flattened
notation is used.

## Nunjucks inheritance

Nunjucks Templates work together with a form of inheritance, and the template for Page is expected to "extend"
another template with all of the real HTML from the `<!doctype>` down to the footer. The code for the default Page
template begins with this:

```
{% extends "page-layout-base" %}
```

And that means that the Nunjucks Template for Page will look for a `page-layout-base.html` in your Theme - these
global Nunjucks inherited files need to be put in a directory called `global` inside your Theme directory.  
(BTW there is a default in case it can't be found, but it just outputs a warning, so you theme _must_ provide
`global/page-layout-base.html`).

Your `page-layout-base.html` can provide some blocks with specific names that the Page (or Piece) will use:

- `pageHeader` - this is inside the `<head>` and sets the `<title>`
- `pageContent` - this is the main body of the content
- `pageOuter` - this is a wrapper around the normal content
- `thinclient` - this loads the thin client javascript

## Special URLs

Zen CMS provides some special URLs that simplify creating a portable theme:

- `/zx/code` - this is the default target output directory
- `/zx/theme` - this is the theme directory

Most theme's `page-layout-base.html` should include this in the `<head>` section:

```
    {% block thinclient %}
    <script src="/qx/code/thinclient/index.js" type="text/javascript"></script>
    {% endblock %}
    <link rel="stylesheet" href="/qx/theme/theme.css">
```
