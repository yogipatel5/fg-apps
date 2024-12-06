// This will take the sheet with the `FBA Inventory Analysis` and add to the shipment to Amazon date with some formatting. These are the relevant sheets with the data we need:

// The final sheet will have the following columns: Date
// - FBA_Status
// - SB_Status
// - Product Name
// - ASIN
// - Merchant SKU
// - FBS SKU
// - Type,Seasonings Included,EXPIRES,Quantity, QTY / MC,TOTAL MC,MC SIZE,MC WEIGHT,LABEL LINK

// `sb_stock_products` : This has the product weight and dimentions you can look up using the UPC
// `sb_shipping_boxes` : The columns we will use to to identfy the box is `id` and we will use the following columns to fill in or calculate:,display_name,weight_oz,purchase_cost

// 'FBA Inventory Analysis' : This has the data we need to add to the shipment to Amazon sheet the relevant columns are: SKU,Product Name,Type,Fulfillable Qty,Can Fulfill?
// 'Available Inventory' : This has the data we need to add to the shipment to Amazon sheet the relevant columns are: UPC,Quantity,Expiration
// 'amz_fba_report' : This has the data we need to add to the shipment to Amazon sheet the relevant columns are: sku,fnsku,asin

//'sb_packaging_map' : Bottles,Inner Box,Inner Box ID,Inner Box Quantity,Master Case,Master Case Box ID - Based off of this will we look up the boxes in `sb_shipping_boxes`

// This is the sheet we will apped the the data: `Shipments_to_Amazon`
// Date - We will set today's date.
// FBA_Status - We will set to 'Pending'
// SB_Status - We will set to 'Pending'
// Product Name - We will use the `Product Name` column from the `FBA Inventory Analysis` sheet
// ASIN - We will use the `ASIN` column from the `FBA Inventory Analysis` sheet
// Merchant SKU - We will use the `Merchant SKU` column from the `FBA Inventory Analysis` sheet
// FBS SKU - We will use the `FBS SKU` column from the `FBA Inventory Analysis` sheet
// Type - We will use the `Type` column from the `FBA Inventory Analysis` sheet
// Seasonings Included - We will use the `Seasonings Included` column from the `FBA Inventory Analysis` sheet
// EXPIRES - We will use the `Expiration` column from the `Available Inventory` sheet
// Quantity - We will use the `Quantity` column from the `Available Inventory` sheet
//  QTY / MC - We will use the `Fulfillable Qty` column from the `FBA Inventory Analysis` sheet
// TOTAL MC - We will use the `TOTAL MC` column from the `FBA Inventory Analysis` sheet
// MC SIZE - We will use the `MC SIZE` column from the `FBA Inventory Analysis` sheet
// MC WEIGHT - We will use the 
// LABEL LINK - We will use the `LABEL LINK` column from the `FBA Inventory Analysis` sheet
