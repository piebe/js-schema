!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.schema=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/schema')

// Patterns
_dereq_('./lib/patterns/reference')
_dereq_('./lib/patterns/nothing')
_dereq_('./lib/patterns/anything')
_dereq_('./lib/patterns/object')
_dereq_('./lib/patterns/or')
_dereq_('./lib/patterns/equality')
_dereq_('./lib/patterns/regexp')
_dereq_('./lib/patterns/class')
_dereq_('./lib/patterns/schema')

// Extensions
_dereq_('./lib/extensions/Boolean')
_dereq_('./lib/extensions/Number')
_dereq_('./lib/extensions/String')
_dereq_('./lib/extensions/Object')
_dereq_('./lib/extensions/Array')
_dereq_('./lib/extensions/Function')
_dereq_('./lib/extensions/Schema')

},{"./lib/extensions/Array":3,"./lib/extensions/Boolean":4,"./lib/extensions/Function":5,"./lib/extensions/Number":6,"./lib/extensions/Object":7,"./lib/extensions/Schema":8,"./lib/extensions/String":9,"./lib/patterns/anything":10,"./lib/patterns/class":11,"./lib/patterns/equality":12,"./lib/patterns/nothing":13,"./lib/patterns/object":14,"./lib/patterns/or":15,"./lib/patterns/reference":16,"./lib/patterns/regexp":17,"./lib/patterns/schema":18,"./lib/schema":19}],2:[function(_dereq_,module,exports){
var Schema =  module.exports = function() {}

Schema.prototype = {
  wrap : function() {
    if (this.wrapped) return this.validate
    this.wrapped = true

    var publicFunctions = [ 'toJSON', 'unwrap' ]
    publicFunctions = publicFunctions.concat(this.publicFunctions || [])

    for (var i = 0; i < publicFunctions.length; i++) {
      if (!this[publicFunctions[i]]) continue
      this.validate[publicFunctions[i]] = this[publicFunctions[i]].bind(this)
    }

    return this.validate
  },

  unwrap : function() {
    return this
  },

  toJSON : session(function(makeReference) {
    var json, session = Schema.session

    // Initializing session if it isnt
    if (!session.serialized) session.serialized = { objects: [], jsons: [], ids: [] }

    var index = session.serialized.objects.indexOf(this)
    if (makeReference && index !== -1) {
      // This was already serialized, returning a JSON schema reference ($ref)
      json = session.serialized.jsons[index]

      // If there was no id given, generating one now
      if (json.id == null) {
        do {
          json.id = 'id-' + Math.floor(Math.random()*100000)
        } while (session.serialized.ids.indexOf(json.id) !== -1)
        session.serialized.ids.push(json.id)
      }

      json = { '$ref': json.id }

    } else {
      // This was not serialized yet, serializing now
      json = {}

      if (this.doc != null) json.description = this.doc

      // Registering that this was serialized and storing the json
      session.serialized.objects.push(this)
      session.serialized.jsons.push(json)
    }

    return json
  })
}

Schema.extend = function(descriptor) {
  if (!descriptor.validate) {
    throw new Error('Schema objects must have a validate function.')
  }

  var constructor = function() {
    if (this.initialize) this.initialize.apply(this, arguments)

    this.validate = this.validate.bind(this)

    this.validate.schema = this.validate
  }

  var prototype = Object.create(Schema.prototype)
  for (var key in descriptor) prototype[key] = descriptor[key]
  constructor.prototype = prototype

  return constructor
}


var active = false
function session(f) {
  return function() {
    if (active) {
      // There's an active session, just forwarding to the original function
      return f.apply(this, arguments)

    } else {
      // The initiator is the one who handles the active flag, and clears the session when it's over
      active = true

      var result = f.apply(this, arguments)

      // Cleanup
      for (var i in session) delete session[i]
      active = false

      return result
    }
  }
}
Schema.session = session

function lastDefinedResult(functions, arg) {
  var i = functions.length, result;
  while (i--) {
    result = functions[i](arg)
    if (result != null) return result
  }
}

var fromJSdefs = []
Schema.fromJS = lastDefinedResult.bind(null, fromJSdefs)
Schema.fromJS.def = Array.prototype.push.bind(fromJSdefs)

var fromJSONdefs = []
Schema.fromJSON = session(lastDefinedResult.bind(null, fromJSONdefs))
Schema.fromJSON.def = Array.prototype.push.bind(fromJSONdefs)

Schema.patterns = {}
Schema.extensions = {}

},{}],3:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')
  , EqualitySchema = _dereq_('../patterns/equality')
  , anything = _dereq_('../patterns/anything').instance

var ArraySchema = module.exports = Schema.extensions.ArraySchema = Schema.extend({
  initialize : function(itemSchema, max, min) {
    this.itemSchema = itemSchema || anything
    this.min = min || 0
    this.max = max || Infinity
  },

  validate : function(instance) {
    // Instance must be an instance of Array
    if (!(instance instanceof Array)) throw new Error('not an array')

    // Checking length
    if (this.min === this.max) {
      if (instance.length !== this.min) throw new Error('array does not contain enought entries (' + instance.length + ' instead of ' + this.min)

    } else {
      if (this.min > 0        && instance.length < this.min) throw new Error('array does not contain enought entries (' + instance.length + ' instead of ' + this.min)
      if (this.max < Infinity && instance.length > this.max) throw new Error('array does contain too many entries (' + instance.length + ' instead of ' + this.min)
    }

    // Checking conformance to the given item schema
    for (var i = 0; i < instance.length; i++) {
      try {
		  this.itemSchema.validate(instance[i])
	  } catch(e) {
		  throw new Error('array contains invalid entry at ' + i + ' --> ' + e.message)
	  }
    }

    return true
  },

  toJSON : Schema.session(function() {
    var json = Schema.prototype.toJSON.call(this, true)

    if (json['$ref'] != null) return json

    json.type = 'array'

    if (this.min > 0) json.minItems = this.min
    if (this.max < Infinity) json.maxItems = this.max
    if (this.itemSchema !== anything) json.items = this.itemSchema.toJSON()

    return json
  })
})

Schema.fromJSON.def(function(sch) {
  if (!sch || sch.type !== 'array') return

  // Tuple typing is not yet supported
  if (sch.items instanceof Array) return

  return new ArraySchema(Schema.fromJSON(sch.items), sch.maxItems, sch.minItems)
})

Array.of = function() {
  // Possible signatures : (schema)
  //                       (length, schema)
  //                       (minLength, maxLength, schema)
  var args = Array.prototype.slice.call(arguments).reverse()
  if (args.length === 2) args[2] = args[1]
  return new ArraySchema(Schema.fromJS(args[0]), args[1], args[2]).wrap()
}

Array.like = function(other) {
  return new EqualitySchema(other).wrap()
}

Array.schema = new ArraySchema().wrap()

},{"../BaseSchema":2,"../patterns/anything":10,"../patterns/equality":12}],4:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

var BooleanSchema = module.exports = Schema.extensions.BooleanSchema =  new Schema.extend({
  validate : function(instance) {
    if (! (Object(instance) instanceof Boolean))
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

},{"../BaseSchema":2}],5:[function(_dereq_,module,exports){
var ReferenceSchema = _dereq_('../patterns/reference')

Function.reference = function(f) {
  return new ReferenceSchema(f).wrap()
}

},{"../patterns/reference":16}],6:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

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

},{"../BaseSchema":2}],7:[function(_dereq_,module,exports){
var ReferenceSchema = _dereq_('../patterns/reference')
  , EqualitySchema = _dereq_('../patterns/equality')
  , ObjectSchema = _dereq_('../patterns/object')

Object.like = function(other) {
  return new EqualitySchema(other).wrap()
}

Object.reference = function(o) {
  return new ReferenceSchema(o).wrap()
}

Object.schema = new ObjectSchema().wrap()

},{"../patterns/equality":12,"../patterns/object":14,"../patterns/reference":16}],8:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')
  , schema = _dereq_('../schema')

var SchemaReference = module.exports = Schema.extensions.SchemaReference = Schema.extend({
  validate : function() {
    throw new Error('Trying to validate unresolved schema reference.')
  },

  resolve : function(schemaDescriptor) {
    var schemaObject = Schema.fromJS(schemaDescriptor)

    for (var key in schemaObject) {
      if (schemaObject[key] instanceof Function) {
        this[key] = schemaObject[key].bind(schemaObject)
      } else {
        this[key] = schemaObject[key]
      }
    }

    delete this.resolve
  },

  publicFunctions : [ 'resolve' ]
})

schema.reference = function(schemaDescriptor) {
  return new SchemaReference()
}

function renewing(ref) {
  ref.resolve = function() {
    Schema.self = schema.self = renewing(new SchemaReference())
    return SchemaReference.prototype.resolve.apply(this, arguments)
  }
  return ref
}

Schema.self = schema.self = renewing(new SchemaReference())

Schema.fromJSON.def(function(sch) {
  if (sch.id == null && sch['$ref'] == null) return

  var id, session = Schema.session

  if (!session.deserialized) session.deserialized = { references: {}, subscribers: {} }

  if (sch.id != null) {
    // This schema can be referenced in the future with the given ID
    id = sch.id

    // Deserializing:
    delete sch.id
    var schemaObject = Schema.fromJSON(sch)
    sch.id = id

    // Storing the schema object and notifying subscribers
    session.deserialized.references[id] = schemaObject
    ;(session.deserialized.subscribers[id] || []).forEach(function(callback) {
      callback(schemaObject)
    })

    return schemaObject

  } else {
    // Referencing a schema given somewhere else with the given ID
    id = sch['$ref']

    // If the referenced schema is already known, we are ready
    if (session.deserialized.references[id]) return session.deserialized.references[id]

    // If not, returning a reference, and when the schema gets known, resolving the reference
    if (!session.deserialized.subscribers[id]) session.deserialized.subscribers[id] = []
    var reference = new SchemaReference()
    session.deserialized.subscribers[id].push(reference.resolve.bind(reference))

    return reference
  }
})

},{"../BaseSchema":2,"../schema":19}],9:[function(_dereq_,module,exports){
var RegexpSchema = _dereq_('../patterns/regexp')

String.of = function() {
  // Possible signatures : (charset)
  //                       (length, charset)
  //                       (minLength, maxLength, charset)
  var args = Array.prototype.slice.call(arguments).reverse()
    , charset = args[0] ? ('[' + args[0] + ']') : '[a-zA-Z0-9]'
    , max =  args[1]
    , min = (args.length > 2) ? args[2] : args[1]
    , regexp = '^' + charset + '{' + (min || 0) + ',' + (max || '') + '}$'

  return new RegexpSchema(RegExp(regexp)).wrap()
}

String.schema = new RegexpSchema().wrap()

},{"../patterns/regexp":17}],10:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

var AnythingSchema = module.exports = Schema.patterns.AnythingSchema = Schema.extend({
  validate : function(instance) {
     if (instance == null)
		 throw new Error('may not be null')
	 return true
  },

  toJSON : function() {
    return { type : 'any' }
  }
})

var anything = AnythingSchema.instance = new AnythingSchema()

Schema.fromJS.def(function(sch) {
  if (sch === undefined) return anything
})

Schema.fromJSON.def(function(sch) {
  if (sch.type === 'any') return anything
})

},{"../BaseSchema":2}],11:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

var ClassSchema = module.exports = Schema.patterns.ClassSchema = Schema.extend({
  initialize : function(constructor) {
    this.constructor = constructor
  },

  validate : function(instance) {
    if (! (instance instanceof this.constructor))
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

},{"../BaseSchema":2}],12:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

// Object deep equality
var equal = function(a, b) {
  // if a or b is primitive, simple comparison
  if (Object(a) !== a || Object(b) !== b) return a === b

  // both a and b must be Array, or none of them
  if ((a instanceof Array) !== (b instanceof Array)) return false

  // they must have the same number of properties
  if (Object.keys(a).length !== Object.keys(b).length) return false

  // and every property should be equal
  for (var key in a) {
    if (!equal(a[key], b[key])) return false
  }

  // if every check succeeded, they are deep equal
  return true
}

var EqualitySchema = module.exports = Schema.patterns.EqualitySchema = Schema.extend({
  initialize : function(object) {
    this.object = object
  },

  validate : function(instance) {
    if (! equal(instance, this.object))
		throw new Error(instance + ' not equal to ' + this.object.toString() )
	return true;
  },

  toJSON : function() {
    var json = Schema.prototype.toJSON.call(this)

    json['enum'] = [this.object]

    return json
  }
})


Schema.fromJS.def(function(sch) {
  if (sch instanceof Array && sch.length === 1) return new EqualitySchema(sch[0])
})

},{"../BaseSchema":2}],13:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

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

},{"../BaseSchema":2}],14:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')
  , anything = _dereq_('./anything').instance
  , nothing = _dereq_('./nothing').instance

var ObjectSchema = module.exports = Schema.patterns.ObjectSchema = Schema.extend({
  initialize : function(properties, other) {
    var self = this

    this.other = other || anything
    this.properties = properties || []

    // Sorting properties into two groups
    this.stringProps = {}, this.regexpProps = []
    this.properties.forEach(function(property) {
      if (typeof property.key === 'string') {
        self.stringProps[property.key] = property
      } else {
        self.regexpProps.push(property)
      }
    })
  },

  validate : function(instance) {
    var self = this

    if (instance == null) throw new Error('No data')

    // Simple string properties
    Object.keys(this.stringProps).every(function(key) {
      if (!(key in instance)) {
		if (self.stringProps[key].min === 0 ) {
			  return true;
		} else {
			throw new Error('Key "' + key + '" must be present')
		}
	  }

	  try {
		  self.stringProps[key].value.validate(instance[key])
	  } catch(e) {
		  throw new Error('invalid key "' + key + '" --> ' + e.message);
	  }
	  return true
    })

    // If there are no RegExp and other validator, that's all
    if (!this.regexpProps.length && this.other === anything) return true

    // Regexp and other properties
    var checked
    for (var instancekey in instance) {

      // Checking the key against every key regexps
      checked = false
      Object.keys(this.regexpProps).every(function(key) {
		  if (!self.regexpProps[key].key.test(instancekey)) return true
		  checked = true
		  try {
			  self.regexpProps[key].value.validate(instance[instancekey])
		  } catch(e) {
			  throw new Error('no match regexp in key "' + instancekey + '" --> ' + e.message);
		  }
		  return true
      })

      // If the key is not matched by regexps and by simple string checks
      // then check it against this.other
		if (!checked && !(instancekey in this.stringProps)) {
			try {
			 this.other.validate(instance[instancekey])
		  } catch(e) {
			  throw new Error('invalid key "' + instancekey + '" --> ' + e.message);
		  }
		}
    }

    // If all checks passed, the instance conforms to the schema
    return true
  },

  toJSON : Schema.session(function() {
    var i, property, regexp, json = Schema.prototype.toJSON.call(this, true)

    if (json['$ref'] != null) return json

    json.type = 'object'

    for (i in this.stringProps) {
      property = this.stringProps[i]
      json.properties = json.properties || {}
      json.properties[property.key] = property.value.toJSON()
      if (property.min === 1) json.properties[property.key].required = true
      if (property.title) json.properties[property.key].title = property.title
    }

    for (i = 0; i < this.regexpProps.length; i++) {
      property = this.regexpProps[i]
      json.patternProperties = json.patternProperties || {}
      regexp = property.key.toString()
      regexp = regexp.substr(2, regexp.length - 4)
      json.patternProperties[regexp] = property.value.toJSON()
      if (property.title) json.patternProperties[regexp].title = property.title
    }

    if (this.other !== anything) {
      json.additionalProperties = (this.other === nothing) ? false : this.other.toJSON()
    }

    return json
  })
})

// Testing if a given string is a real regexp or just a single string escaped
// If it is just a string escaped, return the string. Otherwise return the regexp
var regexpString = (function() {
  // Special characters that should be escaped when describing a regular string in regexp
  var shouldBeEscaped = '[](){}^$?*+.'.split('').map(function(element) {
        return RegExp('(\\\\)*\\' + element, 'g')
      })
  // Special characters that shouldn't be escaped when describing a regular string in regexp
  var shouldntBeEscaped = 'bBwWdDsS'.split('').map(function(element) {
        return RegExp('(\\\\)*' + element, 'g')
      })

  return function(string) {
    var i, j, match

    for (i = 0; i < shouldBeEscaped.length; i++) {
      match = string.match(shouldBeEscaped[i])
      if (!match) continue
      for (j = 0; j < match.length; j++) {
        // If it is not escaped, it must be a regexp (e.g. [, \\[, \\\\[, etc.)
        if (match[j].length % 2 === 1) return RegExp('^' + string + '$')
      }
    }
    for (i = 0; i < shouldntBeEscaped.length; i++) {
      match = string.match(shouldntBeEscaped[i])
      if (!match) continue
      for (j = 0; j < match.length; j++) {
        // If it is escaped, it must be a regexp (e.g. \b, \\\b, \\\\\b, etc.)
        if (match[j].length % 2 === 0) return RegExp('^' + string + '$')
      }
    }

    // It is not a real regexp. Removing the escaping.
    for (i = 0; i < shouldBeEscaped.length; i++) {
      string = string.replace(shouldBeEscaped[i], function(match) {
        return match.substr(1)
      })
    }

    return string
  }
})()

Schema.fromJS.def(function(object) {
  if (!(object instanceof Object)) return

  var other, property, properties = []
  for (var key in object) {
    property = { value : Schema.fromJS(object[key]) }

    // '*' as property name means 'every other property should match this schema'
    if (key === '*') {
      other = property.value
      continue
    }

    // Handling special chars at the beginning of the property name
    property.min = (key[0] === '*' || key[0] === '?') ? 0 : 1
    property.max = (key[0] === '*' || key[0] === '+') ? Infinity : 1
    key = key.replace(/^[*?+]/, '')

    // Handling property title that looks like: { 'a : an important property' : Number }
    key = key.replace(/\s*:[^:]+$/, function(match) {
      property.title = match.replace(/^\s*:\s*/, '')
      return ''
    })

    // Testing if it is regexp-like or not. If it is, then converting to a regexp object
    property.key = regexpString(key)

    properties.push(property)
  }

  return new ObjectSchema(properties, other)
})

Schema.fromJSON.def(function(json) {
  if (!json || json.type !== 'object') return

  var key, properties = []
  for (key in json.properties) {
    properties.push({ min : json.properties[key].required ? 1 : 0
                    , max : 1
                    , key : key
                    , value : Schema.fromJSON(json.properties[key])
                    , title : json.properties[key].title
                    })
  }
  for (key in json.patternProperties) {
    properties.push({ min : 0
                    , max : Infinity
                    , key : RegExp('^' + key + '$')
                    , value : Schema.fromJSON(json.patternProperties[key])
                    , title : json.patternProperties[key].title
                    })
  }

  var other
  if (json.additionalProperties !== undefined) {
    other = json.additionalProperties === false ? nothing : Schema.fromJSON(json.additionalProperties)
  }

  return new ObjectSchema(properties, other)
})

},{"../BaseSchema":2,"./anything":10,"./nothing":13}],15:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')
  , EqualitySchema = _dereq_('../patterns/equality')

var OrSchema = module.exports = Schema.patterns.OrSchema = Schema.extend({
  initialize : function(schemas) {
    this.schemas = schemas
  },

  validate : function(instance) {
	  var error = "";
    if (!this.schemas.some(function(sch) {
       try {
		   sch.validate(instance)
	   } catch (e) {
		   error += e.message
		   return false
	   }
	   return true;
    })) {
		throw new Error('All following conditions are false: ' + error);
	}

	return true;
  },

  toJSON : Schema.session(function() {
    var json = Schema.prototype.toJSON.call(this, true)
      , subjsons = this.schemas.map(function(sch) { return sch.toJSON() })
      , onlyEquality = subjsons.every(function(json) {
          return json['enum'] instanceof Array && json['enum'].length === 1
        })

    if (json['$ref'] != null) return json

    if (onlyEquality) {
      json['enum'] = subjsons.map(function(json) {
        return json['enum'][0]
      })

    } else {
      json['type'] = subjsons.map(function(json) {
        var simpleType = typeof json.type === 'string' && Object.keys(json).length === 1
        return simpleType ? json.type : json
      })
    }

    return json
  })
})


Schema.fromJS.def(function(schemas) {
  if (schemas instanceof Array) return new OrSchema(schemas.map(function(sch) {
    return sch === undefined ? Schema.self : Schema.fromJS(sch)
  }))
})

Schema.fromJSON.def(function(sch) {
  if (!sch) return

  if (sch['enum'] instanceof Array) {
    return new OrSchema(sch['enum'].map(function(object) {
      return new EqualitySchema(object)
    }))
  }

  if (sch['type'] instanceof Array) {
    return new OrSchema(sch['type'].map(function(type) {
      return Schema.fromJSON(typeof type === 'string' ? { type : type } : type)
    }))
  }
})

},{"../BaseSchema":2,"../patterns/equality":12}],16:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

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

},{"../BaseSchema":2}],17:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

var RegexpSchema = module.exports = Schema.patterns.RegexpSchema = Schema.extend({
  initialize : function(regexp) {
    this.regexp = regexp
  },

  validate : function(instance) {
	  if (! (Object(instance) instanceof String)) {
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

},{"../BaseSchema":2}],18:[function(_dereq_,module,exports){
var Schema = _dereq_('../BaseSchema')

Schema.fromJS.def(function(sch) {
  if (sch instanceof Schema) return sch
})

},{"../BaseSchema":2}],19:[function(_dereq_,module,exports){
var Schema = _dereq_('./BaseSchema')

var schema = module.exports = function(schemaDescription) {
  var doc, schemaObject

  if (arguments.length === 2) {
    doc = schemaDescription
    schemaDescription = arguments[1]
  }

  if (this instanceof schema) {
    // When called with new, create a schema object and then return the schema function
    var constructor = Schema.extend(schemaDescription)
    schemaObject = new constructor()
    if (doc) schemaObject.doc = doc
    return schemaObject.wrap()

  } else {
    // When called as simple function, forward everything to fromJS
    // and then resolve schema.self to the resulting schema object
    schemaObject = Schema.fromJS(schemaDescription)
    schema.self.resolve(schemaObject)
    if (doc) schemaObject.doc = doc
    return schemaObject.wrap()
  }
}

schema.Schema = Schema

schema.toJSON = function(sch) {
  return Schema.fromJS(sch).toJSON()
}

schema.fromJS = function(sch) {
  return Schema.fromJS(sch).wrap()
}

schema.fromJSON = function(sch) {
  return Schema.fromJSON(sch).wrap()
}


},{"./BaseSchema":2}]},{},[1])
(1)
});