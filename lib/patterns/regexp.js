var Schema = require('../BaseSchema')

var RegexpSchema = module.exports = Schema.patterns.RegexpSchema = Schema.extend({
  initialize : function(regexp) {
    this.regexp = regexp
  },

  validate : function(instance) {
	  if (! Object(instance) instanceof String) {
		  throw new Error('not a String')
	  }
	  if (this.regexp && !this.regexp.test(instance))
		  throw new Error('"' + instance + '" does not match pattern "' + this.regexp +'"')

	  return true;
  },

  toJSON : function() {
    var json = Schema.prototype.toJSON.call(this)

    json.type = 'string'

    if (this.regexp) {
      json.pattern = this.regexp.toString()
      json.pattern = json.pattern.substr(1, json.pattern.length - 2)
    }

    return json
  }
})

Schema.fromJSON.def(function(sch) {
  if (!sch || sch.type !== 'string') return

  if ('pattern' in sch) {
    return new RegexpSchema(RegExp('^' + sch.pattern + '$'))
  } else if ('minLength' in sch || 'maxLength' in sch) {
    return new RegexpSchema(RegExp('^.{' + [ sch.minLength || 0, sch.maxLength ].join(',') + '}$'))
  } else {
    return new RegexpSchema()
  }
})

Schema.fromJS.def(function(regexp) {
  if (regexp instanceof RegExp) return new RegexpSchema(regexp)
})
