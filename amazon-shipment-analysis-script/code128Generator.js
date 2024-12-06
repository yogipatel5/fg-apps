/**
 * Converts text to Code 128 barcode characters
 * @param {string} text Text to encode
 * @param {string} codeABC Set to use (default "B")
 * @return {string} Encoded text
 */
function encodeToCode128(text, codeABC = "B") {
  // Start character based on code set
  var startCode = String.fromCharCode(codeABC.toUpperCase().charCodeAt(0) + 138);
  var stop = String.fromCharCode(206);

  // Convert to Set C if specified
  text = codeABC == 'C' ? toSetC(text) : text;

  // Calculate checksum
  var check = checkSum128(text, startCode.charCodeAt(0) - 100);

  // Replace space with special character
  text = text.replace(" ", String.fromCharCode(194));

  return startCode + text + check + stop;
}

/**
 * Converts numbers to Set C encoding
 */
function toSetC(text) {
  var pairs = text.match(/\d{2}/g) || [];
  return pairs.map(function(ascii) {
    var codeC = Number(ascii);
    var charCode = codeC > 94 ? codeC + 100 : codeC + 32;
    return String.fromCharCode(charCode);
  }).join('');
}

/**
 * Calculates checksum for Code 128
 */
function checkSum128(data, startCode) {
  var sum = startCode;
  for (var i = 0; i < data.length; i++) {
    var code = data.charCodeAt(i);
    var value = code > 194 ? code - 100 : code - 32;
    sum += (i + 1) * (value);
  }

  var checksum = (sum % 103) + 32;
  if (checksum > 126) checksum = checksum + 68;
  return String.fromCharCode(checksum);
}
