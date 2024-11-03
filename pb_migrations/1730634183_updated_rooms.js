/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("42u0ensfwb9nrwm")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lnu3thwq",
    "name": "game_state",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 2000000
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("42u0ensfwb9nrwm")

  // remove
  collection.schema.removeField("lnu3thwq")

  return dao.saveCollection(collection)
})