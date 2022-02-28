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


qx.Class.define("zx.test.io.persistence.TestPersistence", {
  extend: qx.dev.unit.TestCase,

  members: {
    async testPersistance() {
      let dt = new Date();
      let ctlr = new zx.io.persistence.DatabaseController();
      let db = new zx.io.persistence.db.MemoryDatabase();
      ctlr.addEndpoint(db);
      let pg = new zx.test.io.persistence.Page().set({
        title: "My New Title",
        lastModified: dt
      });
      pg.getPieces().push(new zx.test.io.persistence.Piece().set({ content: "content-one" }));
      pg.getPieces().push(new zx.test.io.persistence.Piece().set({ content: "content-two" }));
      let io = ctlr.getClassIos().getClassIo(pg.constructor);
      let json = await io.toJson(db, pg);
      json._uuid = "UUID-1";
      this.info(JSON.stringify(json, null, 2));
      await ctlr.waitForAll();

      json.pieces[0].mustNotBeThree = 3;
      let exceptionRaised = null;
      try {
        let copy = await io.fromJson(db, json);
        await ctlr.waitForAll();
      } catch (ex) {
        exceptionRaised = ex;
      }
      this.assertFalse(!!exceptionRaised);
      await ctlr.waitForAll();
      ctlr.forgetAllComplete();

      let copy = await io.fromJson(db, json);
      await ctlr.waitForAll();
      ctlr.forgetAllComplete();
      this.assertInstance(copy, zx.test.io.persistence.Page);
      this.assertEquals(2, copy.getPieces().getLength());
      this.assertEquals("content-one", copy.getPieces().getItem(0).getContent());
      this.assertEquals("content-two", copy.getPieces().getItem(1).getContent());
      this.assertEquals("My New Title", copy.getTitle());
      this.assertIdentical(dt.getTime(), copy.getLastModified().getTime());
    },

    async __getByUrl(db, ctlr, url) {
      let json = await db.findOne({ url }, { _uuid: 1 });
      let uuid = json._uuid;
      let obj = uuid ? await ctlr.getByUuid(uuid) : null;
      return obj;
    },

    async testObjectIo() {
      let db = new zx.io.persistence.db.MemoryDatabase();
      let ctlr = new zx.io.persistence.DatabaseController();
      ctlr.addEndpoint(db);
      let obj;

      await db.open();
      await db.importFromDisk("test/persistence/website-db");
      obj = await this.__getByUrl(db, ctlr, "configuration/site");
      let uuid = obj.toUuid();
      this.assertInstance(obj, zx.test.io.persistence.Site);
      obj.setTitle("My Title A");
      await db.put(obj);

      obj = await this.__getByUrl(db, ctlr, "configuration/site");
      this.assertInstance(obj, zx.test.io.persistence.Site);
      this.assertEquals("My Title A", obj.getTitle());
      this.assertEquals(uuid, obj.toUuid());
      obj.setTitle("Test Website for Zenesis Server");
      await db.put(obj);
      await db.close();

      let data = await zx.utils.Json.loadJsonAsync("test/persistence/website-db/configuration/site.json");
      this.assertEquals("Test Website for Zenesis Server", data.title);
      this.assertEquals(uuid, data._uuid);
    },

    async testReferences() {
      let db = new zx.io.persistence.db.MemoryDatabase();
      let ctlr = new zx.io.persistence.DatabaseController();
      ctlr.addEndpoint(db);
      let obj;

      await db.open();
      await db.importFromDisk("test/persistence/website-db");
      let ref1 = new zx.test.io.persistence.DemoReferences().set({
        title: "One"
      });
      let ref2 = new zx.test.io.persistence.DemoReferences().set({
        title: "Two"
      });
      ref1.setOther(ref2);

      await db.put(ref2);
      await db.put(ref1);
      let id1 = ref1.toUuid();
      let id2 = ref2.toUuid();
      this.info(`ref1 = ${id1}`);
      this.info(`ref2 = ${id2}`);

      let data = await db.getDataFromUuid(id1);
      this.assertEquals(data.json.other._uuid, id2);
      ref1 = null;
      ref2 = null;

      ref1 = await ctlr.getByUuid(id1);
      this.assertTrue(!!ref1.getOther());
      this.assertEquals(ref1.toUuid(), id1);
      this.assertEquals(ref1.getOther().toUuid(), id2);
      ref2 = ref1.getOther();
      ref2.setOther(ref1);

      await db.put(ref2);
      await db.put(ref1);

      data = await db.getDataFromUuid(id1);
      this.assertEquals(data.json.other._uuid, id2);
      data = await db.getDataFromUuid(id2);
      this.assertEquals(data.json.other._uuid, id1);
      ref1 = null;
      ref2 = null;

      ref1 = await ctlr.getByUuid(id1);
      ref2 = await ctlr.getByUuid(id2);

      this.assertTrue(!!ref1.getOther());
      this.assertEquals(ref1.toUuid(), id1);
      this.assertEquals(ref1.getOther().toUuid(), id2);

      this.assertTrue(!!ref2.getOther());
      this.assertEquals(ref2.toUuid(), id2);
      this.assertEquals(ref2.getOther().toUuid(), id1);

      this.assertTrue(ref1 === ref2.getOther());
      this.assertTrue(ref2 === ref1.getOther());

      await db.close();
    },

    async testArray() {
      let db = new zx.io.persistence.db.MemoryDatabase();
      let ctlr = new zx.io.persistence.DatabaseController();
      ctlr.addEndpoint(db);
      let obj;

      await db.open();
      let children = new qx.data.Array();
      for (let i = 0; i < 10; i++) {
        let child = new zx.test.io.persistence.DemoReferences().set({
          title: "Child " + (i + 1)
        });
        children.push(child);
        children.push(child);
      }
      let parent = new zx.test.io.persistence.DemoReferences().set({
        title: "Parent",
        myArray: children
      });

      await db.put(parent);
      let idParent = parent.toUuid();
      this.info(`idParent = ${idParent}`);

      let data = await db.getDataFromUuid(idParent);
      this.assertEquals(data.json.myArray.length, 20);
      for (let i = 0; i < 20; i += 2) {
        let childJson = data.json.myArray[i];
        let uuid = children.getItem(i).toUuid();
        this.assertEquals(childJson._uuid, uuid);
        childJson = data.json.myArray[i + 1];
        this.assertEquals(childJson._uuid, uuid);
      }
      await db.close();
    },

    async testMap() {
      let db = new zx.io.persistence.db.MemoryDatabase();
      let ctlr = new zx.io.persistence.DatabaseController();
      ctlr.addEndpoint(db);
      let obj;

      await db.open();

      let parent = new zx.test.io.persistence.DemoReferences().set({
        title: "Parent",
        myArray: new qx.data.Array(),
        myMap: new zx.data.Map()
      });
      let child = new zx.test.io.persistence.DemoReferences().set({
        title: "Child"
      });
      parent.getMyArray().push(child);
      let values = parent.getMyMap();
      values.put("a", "one");
      values.put("b", 2);
      values.put("c1", child);
      values.put("c2", child);

      await db.put(parent);

      let idParent = parent.toUuid();
      this.info(`idParent = ${idParent}`);

      let data = await db.getDataFromUuid(idParent);
      let uuid = child.toUuid();
      this.assertEquals(Object.keys(data.json.myMap).length, 4);
      this.assertEquals(data.json.myMap["a"], "one");
      this.assertEquals(data.json.myMap["b"], 2);
      this.assertEquals(data.json.myMap["c1"]._uuid, uuid);
      this.assertEquals(data.json.myMap["c2"]._uuid, uuid);

      ctlr.removeEndpoint(db);

      let ctlr2 = new zx.io.persistence.DatabaseController();
      ctlr2.addEndpoint(db);
      let parent2 = await ctlr2.getByUuid(idParent);
      let values2 = parent2.getMyMap();
      this.assertEquals(values2.getKeys().getLength(), 4);
      this.assertEquals(values2.getValues().getLength(), 3);
      this.assertEquals(values2.get("a"), "one");
      this.assertEquals(values2.get("b"), 2);
      this.assertEquals(values2.get("c1").toUuid(), uuid);
      this.assertTrue(values2.get("c2") === values2.get("c1"));

      await db.close();
    }
  }
});
