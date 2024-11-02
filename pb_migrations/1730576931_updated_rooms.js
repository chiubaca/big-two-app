/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("42u0ensfwb9nrwm")

  collection.listRule = "players.id = (@request.auth.id = @collection.users.id) "

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("42u0ensfwb9nrwm")

  collection.listRule = "players:each = (@request.auth.id = @collection.users.id) "

  return dao.saveCollection(collection)
})
