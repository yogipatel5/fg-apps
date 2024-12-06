function addDataToSheetRow(sheetName,row,data) {
    // Get the active sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
    // Append the data to the sheet, starting at column A
    var range = sheet.getRange(row, 1, data.length, data[0].length);
    range.setValues(data);
}

function addArrayToSheetColumn(sheet, column, values) {
    const range = [column, "1:", column, values.length].join("");
    const fn = function(v) {
      return [ v ];
    };
    sheet.getRange(range).setValues(values.map(fn));
  }

function getSheetData(sheetName) {
    var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    var data = ss.getRange(1, 1, ss.getLastRow(), ss.getLastColumn()).getValues();
    var data = array_2d_remove_empty_array(data);
    return data
  }
function array_2d_remove_empty_array(arr2d){
  return arr2d.filter(function (x) { /* here, x is an array, not an object */
    // Remove all empty rows
    return !(x.every(element => element === (undefined || null || '')))
  });
}

function addrowtoSheet(sheetName,newArray) {
  // var sheetName = "Ignore List"
  // var newArray = [[today(),UniqueIdentifier]];
  // Logger.log (newArray)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  //game data
  const column = sheet.getRange('A:A')
  const values = column.getValues(); // get all data in one call
  var ctv = 0;
  while ( values[ctv] && values[ctv][0] != "" ) {
    ctv++;
  }

  var arrrow = newArray.length;
  var arrcol = newArray[0].length;
  Logger.log(ctv + " - "+ arrrow + " - " + arrcol)
  var destnewRng = sheet.getRange(ctv+1, 1, arrrow, arrcol).setValues(newArray)
}

function addDataToSheet (sheetName, newArray) {
  // var sheetName = "Ignore List"
  // var newArray = [[today(),UniqueIdentifier]];
  // Logger.log (newArray)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  //game data
  const column = sheet.getRange('A:A')
  const values = column.getValues(); // get all data in one call
  var ctv = 0;
  while ( values[ctv] && values[ctv][0] != "" ) {
    ctv++;
  }

  var arrrow = newArray.length;
  var arrcol = newArray[0].length;
  Logger.log(ctv + " - "+ arrrow + " - " + arrcol)
  var destnewRng = sheet.getRange(ctv+1, 1, arrrow, arrcol).setValues(newArray)
}