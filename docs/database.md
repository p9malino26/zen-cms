# The Zen CMS Database

The CMS uses No-SQL, document based storage of JSON objects, backed by a choice of database implementation -
you can use a simple, hand editable files, or use NeDB, or full-blown MongoDB.

It is also possible to import pages into the database, i.e. to provide a template to pre-populate the database with.
This is a great way of bootstrapping an installation, but while the CMS is in alpha phase and there is not a user
interface to edit the content with, it's very helpful to be able to edit a template and have the CMS import it into
the database.

To configure the database, you use the `"database"` key in your `cms.json`:

```
        "database": {
            "type": "file",
            "directory": "website-db/nedb",
            "import": {
                "templateDir": "website-db/template",
                "when": "always"
            }
        },
```

In that configuration, the CMS will always copy `website-db/template` into the database every time it starts up
(without `"when": "always"`, it will only copy it if the database does not yet exist at all).

The Persistence library maps well known URLs to a JSON document, and then handles the (de-)serialization of objects;
for example, the most basic, single-page website will have documents for `configuration/site` and `pages/index`. Your
template directory (`website-db/template`) needs to look like this:

```
    configuration/
        site.json
    pages/
        index.json
```

### Contents of `configuration/site.json`

```
{
  "__classname": "qx.cms.system.Site",
  "title": "My New Website",
  "uuid": "15485731-dd89-4d3e-88b5-e3e1f735aa53"
}
```

### Contents of `pages/index.json`

````
{
    "__classname": "zx.cms.content.Page",
    "title": "My Home Page",
    "uuid": "dda85601-ccb9-449d-9bf4-48a374978953",
    "pieces": [
        {
            "__classname": "zx.cms.content.ContentPiece",
            "content": "<h1>Hello World</h1>"
        }
    ]
}```
````
