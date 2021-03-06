var Schema = require('../BaseSchema')
  , EqualitySchema = require('../patterns/equality')

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
