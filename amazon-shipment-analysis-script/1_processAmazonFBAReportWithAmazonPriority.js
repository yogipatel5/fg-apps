function processAmazonFBAReportWithAmazonPriority() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('amz_fba_report');
  const targetSheet = ss.getSheetByName('amz_fba_report_analyzed');
  const config = getConfigurationValues();

  if (!targetSheet) {
    ss.insertSheet('amz_fba_report_analyzed');
  }

  const data = sourceSheet.getDataRange().getValues();
  const headers = data[0];

  const rows = data.slice(1);

  const analyzedData = rows
    .filter(row => {
      const sku = row[headers.indexOf('sku')];
      return !config.amz_discontinued.includes(sku);
    })
    .map(row => {
      const item = {
        sku: row[headers.indexOf('sku')] || '',
        'product-name': row[headers.indexOf('product-name')] || '',
        available: Number(row[headers.indexOf('available')] || 0),
        'units-shipped-t7': Number(row[headers.indexOf('units-shipped-t7')] || 0),
        'units-shipped-t30': Number(row[headers.indexOf('units-shipped-t30')] || 0),
        'units-shipped-t60': Number(row[headers.indexOf('units-shipped-t60')] || 0),
        'units-shipped-t90': Number(row[headers.indexOf('units-shipped-t90')] || 0),
        'sales-t7': Number(row[headers.indexOf('sales-shipped-last-7-days')] || 0),
        'sales-t30': Number(row[headers.indexOf('sales-shipped-last-30-days')] || 0),
        'sales-t60': Number(row[headers.indexOf('sales-shipped-last-60-days')] || 0),
        'sales-t90': Number(row[headers.indexOf('sales-shipped-last-90-days')] || 0),

        'Recommended ship-in quantity': Number(row[headers.indexOf('Recommended ship-in quantity')] || 0),
        'Recommended ship-in date': row[headers.indexOf('Recommended ship-in date')] || ''
      };

      return analyzeItem(item, config);
    });

  const analyzedDataWithPriority = calculateSalesPriorityLevel(analyzedData, config);

  analyzedDataWithPriority.sort((a, b) => calculatePriorityScore(b, config) - calculatePriorityScore(a, config));

  // Update the outputHeaders and outputData arrays in the main function:
  const outputHeaders = [
    'Priority', 'SKU', 'Product Name', 'Available', 'Bundle Type',
    '90-Day Units', '90-Day Sales ($)',
    '60-Day Units', '60-Day Sales ($)',
    '30-Day Units', '30-Day Sales ($)',
    '7-Day Units', '7-Day Sales ($)',
    'Daily Avg Sales ($)', 'Best Period',
    'Daily Velocity', 'Weeks of Cover', 'Priority Score',
    'Sales Priority Level',
    'Amazon Recommended Quantity', 'Days of Coverage at Recommended Qty',
    'Suggested Ship Date'
  ];
  calculatePriorityScore();

  const outputData = analyzedDataWithPriority
    .filter(item => !config.amz_discontinued.includes(item.sku))
    .map((item, index) => {
      const dailyVelocity = calculateDailyVelocity(item);
      const recommendedQty = item['Recommended ship-in quantity'] || 0;
      const daysOfCoverage = dailyVelocity > 0 ?
        Math.round((recommendedQty + item.available) / dailyVelocity) :
        999;

      return [
        index + 1,
        item.sku,
        item['product-name'],
        item.available,
        getBundleType(item['product-name']),
        item['units-shipped-t90'] || 0,
        item['sales-t90'] || 0,
        item['units-shipped-t60'] || 0,
        item['sales-t60'] || 0,
        item['units-shipped-t30'] || 0,
        item['sales-t30'] || 0,
        item['units-shipped-t7'] || 0,
        item['sales-t7'] || 0,
        Number(item.dailyAverageSales || 0).toFixed(2),
        item.dailyAveragePeriod,
        dailyVelocity,
        calculateWeeksOfCover(item),
        calculatePriorityScore(item, config),
        item.salesPriority,
        recommendedQty,
        daysOfCoverage,
        item['Recommended ship-in date'] || ''
      ];
    });

  targetSheet.clear();
  targetSheet.getRange(1, 1, 1, outputHeaders.length).setValues([outputHeaders]);
  if (outputData.length > 0) {
    targetSheet.getRange(2, 1, outputData.length, outputHeaders.length).setValues(outputData);
  }

  if (outputData.length > 0) {
    targetSheet.getRange(2, outputHeaders.length, outputData.length, 1).setNumberFormat('MM/dd/yyyy');
  }

  targetSheet.autoResizeColumns(1, outputHeaders.length);
}

function analyzeItem(item, config) {
  // Ensure all required properties exist with default values
  const analyzedItem = {
    ...item,
    available: Number(item.available || 0),
    'units-shipped-t7': Number(item['units-shipped-t7'] || 0),
    'units-shipped-t30': Number(item['units-shipped-t30'] || 0),
    'units-shipped-t60': Number(item['units-shipped-t60'] || 0),
    'units-shipped-t90': Number(item['units-shipped-t90'] || 0),
    'Recommended ship-in quantity': Number(item['Recommended ship-in quantity'] || 0),
  };

  return {
    ...analyzedItem,
    dailyVelocity: calculateDailyVelocity(analyzedItem),
    weeksOfCover: calculateWeeksOfCover(analyzedItem),
    priorityScore: calculatePriorityScore(analyzedItem, config)
  };
}

function calculatePriorityScore(item, config) {
  if (!item) return 0;

  const dailyVelocity = calculateDailyVelocity(item);
  const weeksOfCover = calculateWeeksOfCover(item);
  const recommendedQty = Number(item['Recommended ship-in quantity'] || 0);
  const available = Number(item.available || 0);

  const totalCoverageDays = dailyVelocity > 0 ?
    (recommendedQty + available) / dailyVelocity : 999;
  const isOutOfStock = available === 0 && dailyVelocity > 0;

  const dailySalesVelocity = (Number(item['sales-t90']) || 0) / 90;
  const velocityScore = dailySalesVelocity * config.velocity_weight;
  const coverageScore = (1 / (weeksOfCover + 1)) * config.coverage_weight;

  const recentTrendScore = item['sales-t90'] ?
    (Number(item['sales-t30']) / 30) / (Number(item['sales-t90']) / 90) * config.trend_weight : 0;

  let statusMultiplier = 1;
  if (isOutOfStock) {
    statusMultiplier = config.out_of_stock_multiplier;
  } else if (totalCoverageDays < config.critical_coverage_days) {
    statusMultiplier = config.critical_coverage_multiplier;
  } else if (totalCoverageDays < config.low_coverage_days) {
    statusMultiplier = config.low_coverage_multiplier;
  }

  return (velocityScore + coverageScore + recentTrendScore) * statusMultiplier;
}

function calculateSalesPriorityLevel(analyzedData, config) {
  console.log('Starting calculateSalesPriorityLevel with', analyzedData.length, 'items');

  // Calculate daily average sales for each product
  const productsWithDailyAverages = analyzedData.map(item => {
    const dailyAverages = {
      t7: (Number(item['sales-t7']) || 0) / 7,
      t30: (Number(item['sales-t30']) || 0) / 30,
      t60: (Number(item['sales-t60']) || 0) / 60,
      t90: (Number(item['sales-t90']) || 0) / 90
    };

    // Find the highest daily average and which period it came from
    let bestDailyAverage = 0;
    let bestPeriod = 't90'; // default to 90 days

    Object.entries(dailyAverages).forEach(([period, average]) => {
      if (average > bestDailyAverage) {
        bestDailyAverage = average;
        bestPeriod = period;
      }
    });

    return {
      ...item,
      dailyAverageSales: bestDailyAverage,
      dailyAveragePeriod: bestPeriod
    };
  });

  // Sort products by their best daily average sales
  const sortedData = [...productsWithDailyAverages].sort((a, b) =>
    b.dailyAverageSales - a.dailyAverageSales
  );

  // Calculate total daily average sales
  const totalDailyAverageSales = sortedData.reduce((sum, item) =>
    sum + item.dailyAverageSales, 0
  );

  console.log('Total daily average sales:', totalDailyAverageSales);

  // Calculate running sum and assign priorities
  let runningSum = 0;

  return sortedData.map(item => {
    runningSum += item.dailyAverageSales;
    const percentageOfTotal = runningSum / totalDailyAverageSales;

    let salesPriority;
    if (percentageOfTotal <= 0.85) {
      salesPriority = 'High';
    } else if (percentageOfTotal <= 0.95) {
      salesPriority = 'Medium';
    } else {
      salesPriority = 'Low';
    }

    // Convert period to a more readable format
    const periodDisplay = {
      't7': '7-Day',
      't30': '30-Day',
      't60': '60-Day',
      't90': '90-Day'
    }[item.dailyAveragePeriod];

    console.log(`SKU: ${item.sku}, Daily Avg Sales: $${item.dailyAverageSales.toFixed(2)}, Period: ${periodDisplay}, Running %: ${(percentageOfTotal * 100).toFixed(2)}%, Priority: ${salesPriority}`);

    return {
      ...item,
      salesPriority,
      bestPeriodSales: item.dailyAverageSales * 30,
      dailyAverageSales: item.dailyAverageSales,
      dailyAveragePeriod: periodDisplay
    };
  });
}


///////////HELPERS
function calculateDailyVelocity(item) {
  if (!item || typeof item['units-shipped-t90'] === 'undefined') {
    console.log('Problem item in calculateDailyVelocity:', item);
    return 0;
  }
  return (Number(item['units-shipped-t90']) || 0) / 90;
}

function calculateWeeksOfCover(item) {
  const dailyVelocity = calculateDailyVelocity(item);
  return dailyVelocity > 0 ? (item.available / dailyVelocity) / 7 : 999;
}

function getBundleType(productName) {
  if (productName.includes('Pack of 2') || productName.includes('2 Bottles')) return '2-Pack';
  if (productName.includes('Pack of 3') || productName.includes('3 Bottles')) return '3-Pack';
  if (productName.includes('Pack of 4') || productName.includes('4 Bottles')) return '4-Pack';
  return 'Single';
}