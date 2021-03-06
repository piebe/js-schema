var Schema = require('../BaseSchema')

var NumberSchema = module.exports = Schema.extensions.NumberSchema = Schema.extend({
  initialize : function(minimum, exclusiveMinimum, maximum, exclusiveMaximum, divisibleBy) {
    this.minimum = minimum != null ? minimum : -Infinity
    this.exclusiveMinimum = exclusiveMinimum
    this.maximum = minimum != null ? maximum : Infinity
    this.exclusiveMaximum = exclusiveMaximum
    this.divisibleBy = divisibleBy || 0
  },

  min : function(minimum) {
    return new NumberSchema( minimum, false
                           , this.maximum, this.exclusiveMaximum
                           , this.divisibleBy
                           ).wrap()
  },

  above : function(minimum) {
    return new NumberSchema( minimum, true
                           , this.maximum, this.exclusiveMaximum
                           , this.divisibleBy
                           ).wrap()
  },

  max : function(maximum) {
    return new NumberSchema( this.minimum, this.exclusiveMinimum
                           , maximum, false
                           , this.divisibleBy
                           ).wrap()
  },

  below : function(maximum) {
    return new NumberSchema( this.minimum, this.exclusiveMinimum
                           , maximum, true
                           , this.divisibleBy
                           ).wrap()
  },

  step : function(divisibleBy) {
    return new NumberSchema( this.minimum, this.exclusiveMinimum
                           , this.maximum, this.exclusiveMaximum
                           , divisibleBy
                           ).wrap()
  },

  publicFunctions : [ 'min', 'above', 'max', 'below', 'step' ],

  validate : function(instance) {
    if (! (Object(instance) instanceof Number))
	  throw new Error('not a Number')
	if (!(this.exclusiveMinimum ? instance >  this.minimum
                                  : instance >= this.minimum))
		throw new Error(instance + ' does not exceed minimum ' + this.minimum)
    if (! (this.exclusiveMaximum ? instance <  this.maximum
                                  : instance <= this.maximum))
		throw new Error(instance + ' exceeds maximum ' + this.maximum)

	if (!(this.divisibleBy === 0 || instance % this.divisibleBy === 0))
		  throw new Error(' is not divisible by ' + this.divisibleBy )

	return true
  },

  toJSON : function() {
    var json = Schema.prototype.toJSON.call(this)

    json.type = ( this.divisibleBy !== 0 && this.divisibleBy % 1 === 0 ) ? 'integer' : 'number'

    if (this.divisibleBy !== 0 && this.divisibleBy !== 1) json.divisibleBy = this.divisibleBy

    if (this.minimum !== -Infinity) {
      json.minimum = this.minimum
      if (this.exclusiveMinimum === true) json.exclusiveMinimum = true
    }

    if (this.maximum !== Infinity) {
      json.maximum = this.maximum
      if (this.exclusiveMaximum === true) json.exclusiveMaximum = true
    }

    return json
  }
})

Schema.fromJSON.def(function(sch) {
  if (!sch || (sch.type !== 'number' && sch.type !== 'integer')) return

  return new NumberSchema( sch.minimum, sch.exclusiveMinimum
                         , sch.maximum, sch.exclusiveMaximum
                         , sch.divisibleBy || (sch.type === 'integer' ? 1 : 0)
                         )
})

Number.schema     = new NumberSchema().wrap()
Number.min        = Number.schema.min
Number.above      = Number.schema.above
Number.max        = Number.schema.max
Number.below      = Number.schema.below
Number.step       = Number.schema.step

Number.Integer = Number.step(1)
