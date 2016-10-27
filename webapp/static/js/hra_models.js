const Backbone = require('backbone');

const HRA = Backbone.Model.extend({
  urlRoot: '/hras',
  // initialize: function() { get new, unsaved HRA from server}
});

const HRACollection = Backbone.Collection.extend({
  model: HRA,
  url: '/hras',
  comparison: 'DATE_CREATED',
});

module.exports = { HRA, HRACollection };
