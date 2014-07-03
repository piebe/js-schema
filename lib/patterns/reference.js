var Schema = require('../BaseSchema')

var ReferenceSchema = module.exports = Schema.patterns.ReferenceSchema = Schema.extend({
  initialize : function(value) {
    this.value = value
  },

  validate : function(instance) {
    if (instance !== this.value)
		throw new Error(instance + ' is not the same as ' + this.value)
	return true;
  },

  toJSON : function() {
    var json = Schema.prototype.toJSON.call(this)

    json['enum'] = [this.value]

    return json
  }
})


Schema.fromJS.def(function(value) {
  return new ReferenceSchema(value)
})
