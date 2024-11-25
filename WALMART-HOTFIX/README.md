# WALMART-HOTFIX

## Description
this is a Flavorgod Seasoning Project for products Selling on Walmart.com

We recently had to change our bottle sizes and there are bundles that need to be replaced into our product management system. This project is to identify the products that are in Walmart that are still using the old bottles and create a csv to upload to update our product management system.

## Developer Notes
This is a Google Apps Script managed in the cloud. We are developing in local and testing in cloud. The examples and local .csv files are just for reference while developing, the actual data is present in the sheets online.

### Google Apps Script Specifics:
- Do NOT use `require()` or `module.exports` - Google Apps Script doesn't support Node.js module system
- Do NOT use `global` object - Google Apps Script makes functions and classes available in the script scope automatically
- All `.gs` or `.js` files are bundled together in the same scope when deployed
- Functions and classes are directly accessible across all script files without any import/export statements

### Project Files:
Product Management Example Template
- examples/product_management_template.csv

Google Sheets Tabs
- `WalmartExport` - This is an export of the product in walmart. The products are in question and we need to confirm there isn't a new bundle we can change the sku to and if that is the case we will create a new product to be exported into our product management software. We will look for `replacement status` = `Need` and `current` is blank. The example csv of this Google Sheet Tab is `examples/WalmartExport.csv`

- `PVPV_Export` - This is from our product mangement software that has parent sku to upc in a one to many relationship for bundled products. `examples/PVPV_Export.csv`

- `Compiled` - This is my main product organization of all the new products, wether they are in walmart or not, I am starting a master list. `examples/Compiled.csv`
