/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("l11s8oriuexiost");

  return dao.deleteCollection(collection);
}, (db) => {
  const collection = new Collection({
    "id": "l11s8oriuexiost",
    "created": "2024-11-23 14:04:17.402Z",
    "updated": "2024-11-23 14:04:17.402Z",
    "name": "roomsV2",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "i1y3oo5z",
        "name": "game_state",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
})
