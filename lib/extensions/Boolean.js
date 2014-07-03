var Schema = require('../BaseSchema')

var BooleanSchema = module.exports = Schema.extensions.BooleanSchema =  new Schema.extend({
  validate : function(instance) {
    if (!Object(instance) instanceof Boolean)
		throw new Error('not a Boolean')

	return true
  },

  toJSON : function() {
    return { type : 'boolean' }
  }
})

var booleanSchema = module.exports = new BooleanSchema().wrap()

Schema.fromJSON.def(function(sch) {
  if (!sch || sch.type !== 'boolean') return

  return booleanSchema
})

Boolean.schema = booleanSchema
