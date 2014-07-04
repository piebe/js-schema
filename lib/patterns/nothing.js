var Schema = require('../BaseSchema')

var NothingSchema = module.exports = Schema.patterns.NothingSchema = Schema.extend({
  validate : function(instance) {
	  if (instance != null)
		  throw new Error('must be null or not present')
	  return true
  },

  toJSON : function() {
    return { type : 'null' }
  }
})

var nothing = NothingSchema.instance = new NothingSchema()

Schema.fromJS.def(function(sch) {
  if (sch === null) return nothing
})

Schema.fromJSON.def(function(sch) {
  if (sch.type === 'null') return nothing
})
