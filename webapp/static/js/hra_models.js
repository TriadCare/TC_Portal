var HRA = Backbone.Model.extend({
  urlRoot: '/hras',
  //initialize: function() { get new, unsaved HRA from server}

});



var HRA_Collection = Backbone.Collection.extend({
  model: HRA,
  url: '/hras',
  comparison: "DATE_CREATED"
});


module.exports = {HRA: HRA, HRA_Collection: HRA_Collection}
