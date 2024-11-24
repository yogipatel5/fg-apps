
function prepareWalmartProductPayload() {
  // Connect to the database
  var conn = getProductConnection();

  // Execute the query to get the data
  var stmt = conn.createStatement();
  var rs = stmt.executeQuery("SELECT walmart_sku as sku, if(inventory_available<50,0,inventory_available) as quantity FROM products LEFT JOIN product_identifiers pi on products.upc = pi.product_upc where walmart_sku is not null");

  // Prepare the payload object
  var payload = {
    "MPItemFeedHeader": {
        "sellingChannel": "mpmaintenance",
        "processMode": "REPLACE",
        "subset": "EXTERNAL",
        "locale": "en",
        "version": "1.5",
        "subCategory": "office_other"
    },
    "MPItem": {
        "Orderable": {
            "sku": "00078742044555",
            "productIdentifiers": {
                "productIdType": "GTIN",
                "productId": "00649081365761"
            }
        },
        "productName": "Buttery Cinnamon Roll ",
        "brand": {
            "type": "string",
            "title": "Brand",
            "minLength": 1,
            "maxLength": 60
        },
        "pricePerUnit": {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
                "pricePerUnitQuantity": {
                    "type": "number",
                    "title": "PPU Quantity of Units",
                    "minimum": 0,
                    "maximum": 1000000000,
                    "exclusiveMaximum": false,
                    "multipleOf": 0.001
                },
                "pricePerUnitUom": {
                    "type": "string",
                    "title": "PPU Unit of Measure",
                    "enum": [
                        "Pound",
                        "Yard",
                        "Square Foot",
                        "Inch",
                        "Ounce",
                        "Fluid Ounce",
                        "Each",
                        "Foot",
                        "Cubic Foot"
                    ]
                }
            }
        },
        "multipackQuantity": {
            "type": "integer",
            "title": "Multipack Quantity",
            "minimum": 0,
            "maximum": 10000,
            "exclusiveMaximum": false
        },
        "electronicsIndicator": {
            "//  \"electronicsIndicator\"": "No",
            "type": "string",
            "title": "Contains Electronic Component?",
            "enum": [
                "Yes",
                "No"
            ]
        },
        "batteryTechnologyType": {
            "//  \"batteryTechnologyType\"": "Does Not Contain a Battery",
            "type": "string",
            "title": "Contained Battery Type",
            "enum": [
                "Mercury",
                "Carbon Zinc",
                "Lead Acid (Non-Spillable)",
                "Alkaline",
                "Does Not Contain a Battery",
                "Thermal",
                "Lithium Primary (Lithium Metal)",
                "Nickel Cadmium",
                "Lithium Ion",
                "Nickel Metal Hydride",
                "Lead Acid",
                "Multiple Types",
                "Other",
                "Silver",
                "Magnesium"
            ]
        },
        "chemicalAerosolPesticide": {
            "type": "string",
            "title": "Contains Chemical, Aerosol or Pesticide?",
            "enum": [
                "Yes",
                "No"
            ]
        },
        "price": {
            "type": "number",
            "title": "Selling Price",
            "minimum": 0,
            "maximum": 1000000000,
            "exclusiveMaximum": false,
            "multipleOf": 0.01
        },
        "startDate": {
            "type": "string",
            "title": "Site Start Date",
            "format": "date-time"
        },
        "endDate": {
            "type": "string",
            "title": "Site End Date",
            "format": "date-time"
        },
        "shipsInOriginalPackaging": {
            "type": "string",
            "title": "Ships in Original Packaging",
            "enum": [
                "Yes",
                "No"
            ]
        },
        "MustShipAlone": {
            "type": "string",
            "title": "Must ship alone?",
            "enum": [
                "Yes",
                "No"
            ]
        },
        "additionalOfferAttributes": {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "array",
            "title": "Additional Offer Attributes",
            "items": {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "properties": {
                    "additionalOfferAttributeName": {
                        "type": "string",
                        "title": "Additional Offer Attribute Name",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "additionalOfferAttributeValue": {
                        "type": "string",
                        "title": "Additional Offer Attribute Value",
                        "minLength": 1,
                        "maxLength": 100
                    }
                },
                "required": [
                    "additionalOfferAttributeName",
                    "additionalOfferAttributeValue"
                ],
                "additionalProperties": false
            },
            "minItems": 1
        },
        "ShippingWeight": {
            "type": "number",
            "title": "Shipping Weight (lbs)",
            "minimum": 0,
            "maximum": 1000000000,
            "exclusiveMaximum": false,
            "multipleOf": 0.001
        },
        "Visible": {
            "Food & Beverage": {
                "shortDescription": {
                    "type": "string",
                    "title": "Site Description",
                    "minLength": 1,
                    "maxLength": 4000
                },
                "prop65WarningText": {
                    "type": "string",
                    "title": "California Prop 65 Warning Text",
                    "minLength": 1,
                    "maxLength": 5000
                },
                "ingredients": {
                    "type": "string",
                    "title": "Ingredients Statement",
                    "minLength": 1,
                    "maxLength": 4000
                },
                "labelImage": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Label Image",
                    "items": {
                        "$schema": "http://json-schema.org/draft-04/schema#",
                        "type": "object",
                        "properties": {
                            "labelImageContains": {
                                "type": "string",
                                "title": "Label Image Contains",
                                "enum": [
                                    "Supplement Facts",
                                    "Drug Facts",
                                    "Nutrition Facts",
                                    "Ingredient List",
                                    "No Label"
                                ]
                            },
                            "labelImageURL": {
                                "type": "string",
                                "title": "Label Image URL",
                                "minLength": 1,
                                "format": "uri"
                            }
                        },
                        "additionalProperties": false
                    },
                    "minItems": 1
                },
                "mainImageUrl": {
                    "type": "string",
                    "title": "Main Image URL",
                    "minLength": 1,
                    "maxLength": 2000,
                    "format": "uri"
                },
                "productSecondaryImageURL": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Additional Image URL",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 2000,
                        "format": "uri"
                    },
                    "minItems": 1
                },
                "keyFeatures": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Key Features",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 4000
                    },
                    "minItems": 1
                },
                "manufacturer": {
                    "type": "string",
                    "title": "Manufacturer Name",
                    "minLength": 1,
                    "maxLength": 60
                },
                "countPerPack": {
                    "type": "integer",
                    "title": "Count Per Pack",
                    "minimum": 0,
                    "maximum": 1000000000,
                    "exclusiveMaximum": false
                },
                "count": {
                    "type": "string",
                    "title": "Total Count",
                    "minLength": 1,
                    "maxLength": 50
                },
                "msrp": {
                    "type": "number",
                    "title": "MSRP",
                    "minimum": 0,
                    "maximum": 100000000,
                    "exclusiveMaximum": false,
                    "multipleOf": 0.01
                },
                "flavor": {
                    "type": "string",
                    "title": "Flavor",
                    "minLength": 1,
                    "maxLength": 600
                },
                "size": {
                    "type": "string",
                    "title": "Size",
                    "minLength": 1,
                    "maxLength": 500
                },
                "meal": {
                    "type": "string",
                    "title": "Meal",
                    "minLength": 1,
                    "maxLength": 200
                },
                "mealStyle": {
                    "type": "string",
                    "title": "Meal Style",
                    "minLength": 1,
                    "maxLength": 600
                },
                "dietType": {
                    "type": "string",
                    "title": "Diet Type",
                    "enum": [
                        "12 - Fat Free",
                        "01 - Vegetarian",
                        "08 - Without Beef",
                        "02 - Coeliac",
                        "03 - Dietetic",
                        "09 - Organic",
                        "14 - Sugar Free",
                        "13 - Gluten Free",
                        "10 - Without Pork",
                        "04 - Halal",
                        "11 - Better For You",
                        "07 - All Natural",
                        "06 - Vegan",
                        "05 - Kosher"
                    ]
                },
                "servingSize": {
                    "type": "string",
                    "title": "Serving Size",
                    "minLength": 1,
                    "maxLength": 600
                },
                "servingsPerContainer": {
                    "type": "number",
                    "title": "Servings Per Container",
                    "minimum": 0,
                    "maximum": 1000000000,
                    "exclusiveMaximum": false,
                    "multipleOf": 0.001
                },
                "calories": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": {
                        "measure": {
                            "type": "integer",
                            "title": "Measure",
                            "minimum": 0,
                            "maximum": 1000000000,
                            "exclusiveMaximum": false
                        },
                        "unit": {
                            "type": "string",
                            "title": "Unit",
                            "enum": [
                                "Calories"
                            ]
                        }
                    },
                    "additionalProperties": false
                },
                "caloriesFromFat": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": {
                        "measure": {
                            "type": "integer",
                            "title": "Measure",
                            "minimum": 0,
                            "maximum": 1000000000,
                            "exclusiveMaximum": false
                        },
                        "unit": {
                            "type": "string",
                            "title": "Unit",
                            "enum": [
                                "Calories"
                            ]
                        }
                    },
                    "additionalProperties": false
                },
                "totalFat": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": {
                        "measure": {
                            "type": "number",
                            "title": "Measure",
                            "minimum": 0,
                            "maximum": 1000000000,
                            "exclusiveMaximum": false,
                            "multipleOf": 0.001
                        },
                        "unit": {
                            "type": "string",
                            "title": "Unit",
                            "enum": [
                                "g"
                            ]
                        }
                    },
                    "additionalProperties": false
                },
                "totalFatPercentageDailyValue": {
                    "type": "number",
                    "title": "Total Fat Percentage Daily Value",
                    "minimum": 0,
                    "maximum": 1000000000,
                    "exclusiveMaximum": false,
                    "multipleOf": 0.001
                },
                "totalCarbohydrate": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": {
                        "measure": {
                            "type": "number",
                            "title": "Measure",
                            "minimum": 0,
                            "maximum": 1000000000,
                            "exclusiveMaximum": false,
                            "multipleOf": 0.001
                        },
                        "unit": {
                            "type": "string",
                            "title": "Unit",
                            "enum": [
                                "g"
                            ]
                        }
                    },
                    "additionalProperties": false
                },
                "nutrients": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Nutrients",
                    "items": {
                        "$schema": "http://json-schema.org/draft-04/schema#",
                        "type": "object",
                        "properties": {
                            "nutrientName": {
                                "type": "string",
                                "title": "Name",
                                "minLength": 1,
                                "maxLength": 4000
                            },
                            "nutrientAmount": {
                                "type": "string",
                                "title": "Amount",
                                "minLength": 1,
                                "maxLength": 400
                            },
                            "nutrientPercentageDailyValue": {
                                "type": "string",
                                "title": "Percentage Daily Value",
                                "minLength": 1,
                                "maxLength": 20
                            }
                        },
                        "additionalProperties": false
                    },
                    "minItems": 1
                },
                "nutrientFootnote": {
                    "type": "string",
                    "title": "Nutrient Footnote",
                    "minLength": 1,
                    "maxLength": 4000
                },
                "totalProteinPercentageDailyValue": {
                    "type": "number",
                    "title": "Total Protein Percentage Daily Value",
                    "minimum": 0,
                    "maximum": 1000000000,
                    "exclusiveMaximum": false,
                    "multipleOf": 0.001
                },
                "totalProtein": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": {
                        "measure": {
                            "type": "number",
                            "title": "Measure",
                            "minimum": 0,
                            "maximum": 1000000000,
                            "exclusiveMaximum": false,
                            "multipleOf": 0.001
                        },
                        "unit": {
                            "type": "string",
                            "title": "Unit",
                            "enum": [
                                "g"
                            ]
                        }
                    },
                    "additionalProperties": false
                },
                "totalCarbohydratePercentageDailyValue": {
                    "type": "number",
                    "title": "Total Carbohydrate Percentage Daily Value",
                    "minimum": 0,
                    "maximum": 1000000000,
                    "exclusiveMaximum": false,
                    "multipleOf": 0.001
                },
                "shelfLife": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": {
                        "measure": {
                            "type": "integer",
                            "title": "Measure",
                            "minimum": 0,
                            "maximum": 10000,
                            "exclusiveMaximum": false
                        },
                        "unit": {
                            "type": "string",
                            "title": "Unit",
                            "enum": [
                                "days"
                            ]
                        }
                    },
                    "additionalProperties": false
                },
                "foodForm": {
                    "type": "string",
                    "title": "Food Form",
                    "minLength": 1,
                    "maxLength": 600
                },
                "containerType": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Container Type",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 200
                    },
                    "minItems": 1
                },
                "foodAllergenStatements": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Allergens",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 4000
                    },
                    "minItems": 1
                },
                "instructions": {
                    "type": "string",
                    "title": "Instructions",
                    "minLength": 1,
                    "maxLength": 4000
                },
                "caffeineDesignation": {
                    "type": "string",
                    "title": "Caffeine Designation",
                    "enum": [
                        "Caffeine Added",
                        "Naturally Decaffeinated",
                        "Decaffeinated",
                        "Naturally Caffeinated"
                    ]
                },
                "spiceLevel": {
                    "type": "string",
                    "title": "Spice Level",
                    "minLength": 1,
                    "maxLength": 200
                },
                "beefCut": {
                    "type": "string",
                    "title": "Beef Cut",
                    "minLength": 1,
                    "maxLength": 200
                },
                "poultryCut": {
                    "type": "string",
                    "title": "Poultry Cut",
                    "minLength": 1,
                    "maxLength": 100
                },
                "releaseDate": {
                    "type": "string",
                    "title": "Release Date",
                    "format": "date-time"
                },
                "safeHandlingInstructions": {
                    "type": "string",
                    "title": "Safe Handling Instructions",
                    "minLength": 1,
                    "maxLength": 4000
                },
                "cuisine": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Cuisine",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 200
                    },
                    "minItems": 1
                },
                "foodPreparationTips": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Serving Suggestion",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 4000
                    },
                    "minItems": 1
                },
                "puffedSnackType": {
                    "type": "string",
                    "title": "Puffed Snack Type",
                    "enum": [
                        "Ready to Eat Popcorn",
                        "Popcorn Kernel",
                        "Microwave Popcorn"
                    ]
                },
                "nutrientContentClaims": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Nutrient Content Claims",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 4000
                    },
                    "minItems": 1
                },
                "dietaryMethod": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Dietary Method",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 1000
                    },
                    "minItems": 1
                },
                "character": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Character",
                    "items": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 400
                    },
                    "minItems": 1
                },
                "additionalProductAttributes": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Additional Product Attributes",
                    "items": {
                        "$schema": "http://json-schema.org/draft-04/schema#",
                        "type": "object",
                        "properties": {
                            "productAttributeName": {
                                "type": "string",
                                "title": "Additional Product Attribute Name",
                                "minLength": 1,
                                "maxLength": 100
                            },
                            "productAttributeValue": {
                                "type": "string",
                                "title": "Additional Product Attribute Value",
                                "minLength": 1,
                                "maxLength": 4000
                            }
                        },
                        "additionalProperties": false
                    },
                    "minItems": 1
                },
                "variantGroupId": {
                    "type": "string",
                    "title": "Variant Group ID",
                    "minLength": 1,
                    "maxLength": 300
                },
                "variantAttributeNames": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Variant Attribute Names",
                    "items": {
                        "type": "string",
                        "enum": [
                            "count",
                            "countPerPack",
                            "flavor",
                            "size"
                        ]
                    },
                    "minItems": 1
                },
                "isPrimaryVariant": {
                    "type": "string",
                    "title": "Is Primary Variant",
                    "enum": [
                        "Yes",
                        "No"
                    ]
                },
                "swatchImages": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "array",
                    "title": "Swatch Images",
                    "items": {
                        "$schema": "http://json-schema.org/draft-04/schema#",
                        "type": "object",
                        "properties": {
                            "swatchVariantAttribute": {
                                "type": "string",
                                "title": "Swatch Variant Attribute",
                                "enum": [
                                    "count",
                                    "countPerPack",
                                    "flavor",
                                    "size"
                                ]
                            },
                            "swatchImageUrl": {
                                "type": "string",
                                "title": "Swatch Image URL",
                                "minLength": 1,
                                "maxLength": 2000,
                                "format": "uri"
                            }
                        }
                    }
                }
            }
        }
    }
  };

  // Load the schema file
  var schemaUrl = 'https://developer.walmart.com/image/asdp/us/mp/item/spec/4.6/MP_MAINTENANCE_SPEC_4.6.json';
  var schemaResponse = UrlFetchApp.fetch(schemaUrl);
  var schema = JSON.parse(schemaResponse.getContentText());

  // Construct the payload
  var payload = {
    name: 'John',
    age: 30,
    email: 'john@example.com'
  };

  // Validate the payload against the schema
  var validationResult = validatePayload(payload, schema);
  if (validationResult !== null) {
    throw new Error('Payload validation error: ' + validationResult);
  }
  // Loop through the results and add them to the payload
  while (rs.next()) {
    var sku = rs.getString("sku");
    var quantity = rs.getInt("quantity");

    var item = {
      "sku": sku,
      "quantity": {
        "unit": "EACH",
        "amount": quantity
      }
    };

    payload.Inventory.push(item);
  }

  // Close the database connection and return the payload
  rs.close();
  stmt.close();
  conn.close();
  Logger.log(JSON.stringify(payload))
  return JSON.stringify(payload);
}

