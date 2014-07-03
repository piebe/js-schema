var Schema = require('../BaseSchema')

var ClassSchema = module.exports = Schema.patterns.ClassSchema = Schema.extend({
  initialize : function(constructor) {
    this.constructor = constructor
  },

  validate : function(instance) {
    if (instance instanceof this.constructor)
		throw new Error('not a class constructor')
	return true;
  }
})


Schema.fromJS.def(function(constructor) {
  if (!(constructor instanceof Function)) return

  if (constructor.schema instanceof Function) {
    return constructor.schema.unwrap()
  } else {
    return new ClassSchema(constructor)
  }
})
