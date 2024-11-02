/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("42u0ensfwb9nrwm")

  collection.listRule = "players:each ?= (@request.auth.id = players.id) "

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("42u0ensfwb9nrwm")

  collection.listRule = " @request.auth.id ?= @collection.rooms.admin.rooms_via_players.players:each "

  return dao.saveCollection(collection)
})
