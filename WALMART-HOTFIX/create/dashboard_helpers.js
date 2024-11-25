
function processCreateData() {
    const createData = getSheetData('WalmartExport', 'Status', 'Create');
    const dashboardUploadSheet = createDashboardUploadSheet();
    const creator = new DashboardProductCreator(dashboardUploadSheet);

    createData.forEach(product => {
        creator.createBundleProduct(product);
    });
}

// Helper sheet function that takes in a sheet name, header , and header=x, then returns the object(s)
function getSheetData(sheetName, header, headerValue) {
    // For testing lets just set the name to WalmartExport
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const headerIndex = headers.indexOf(header);

    return data.slice(1).filter(row => row[headerIndex] === headerValue).map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = row[index];
            return acc;
        }, {});
    });

}

function getFormattedSheetData() {
    const dashboardSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard Upload');
    if (!dashboardSheet) {
        return 'Dashboard Upload sheet not found';
    }

    const data = dashboardSheet.getDataRange().getValues();

    // Convert the 2D array to tab-delimited string
    const formattedData = data.map(row => row.join('\t')).join('\n');

    console.log(formattedData);
    return formattedData;
}


function createDashboardUploadSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let dashboardUploadSheet = ss.getSheetByName('Dashboard Upload');

    // If sheet exists, clear it. If not, create it
    if (dashboardUploadSheet) {
        dashboardUploadSheet.clear();
    } else {
        dashboardUploadSheet = ss.insertSheet('Dashboard Upload');
    }

    // Add Headers to Sheet: (type,id,sku,parent_sku,upc,name,titlename,slug,description,enabled,external_url,options,variant_type,product_type,buy_button_text,in_stock_text,download_link,hide_options_from_display_name,customer_service_can_add,price1_name,price1_value,price2_name,price2_value,price3_name,price3_value,price4_name,price4_value,price5_name,price5_value,price6_name,price6_value,price7_name,price7_value,price8_name,price8_value,price9_name,price9_value,price10_name,price10_value,price11_name,price11_value,price12_name,price12_value,price13_name,price13_value,price14_name,price14_value,price15_name,price15_value,item1_sku,item1_qty,item1_badge,item2_sku,item2_qty,item2_badge,item3_sku,item3_qty,item3_badge,item4_sku,item4_qty,item4_badge,item5_sku,item5_qty,item5_badge,item6_sku,item6_qty,item6_badge,item7_sku,item7_qty,item7_badge,item8_sku,item8_qty,item8_badge,item9_sku,item9_qty,item9_badge,item10_sku,item10_qty,item10_badge,item11_sku,item11_qty,item11_badge,item12_sku,item12_qty,item12_badge,item13_sku,item13_qty,item13_badge,item14_sku,item14_qty,item14_badge,item15_sku,item15_qty,item15_badge,item16_sku,item16_qty,item16_badge,item17_sku,item17_qty,item17_badge,item18_sku,item18_qty,item18_badge,item19_sku,item19_qty,item19_badge,item20_sku,item20_qty,item20_badge,item21_sku,item21_qty,item21_badge,item22_sku,item22_qty,item22_badge,item23_sku,item23_qty,item23_badge,item24_sku,item24_qty,item24_badge,item25_sku,item25_qty,item25_badge,item26_sku,item26_qty,item26_badge,item27_sku,item27_qty,item27_badge,item28_sku,item28_qty,item28_badge,item29_sku,item29_qty,item29_badge,item30_sku,item30_qty,item30_badge,item31_sku,item31_qty,item31_badge,item32_sku,item32_qty,item32_badge,item33_sku,item33_qty,item33_badge,item34_sku,item34_qty,item34_badge,item35_sku,item35_qty,item35_badge,item36_sku,item36_qty,item36_badge,item37_sku,item37_qty,item37_badge,item38_sku,item38_qty,item38_badge,item39_sku,item39_qty,item39_badge,item40_sku,item40_qty,item40_badge,sort_order)
    const headers = [
        'type',
        'id',
        'sku',
        'parent_sku',
        'upc',
        'name',
        'titlename',
        'slug',
        'description',
        'enabled',
        'external_url',
        'options',
        'variant_type',
        'product_type',
        'buy_button_text',
        'in_stock_text',
        'download_link',
        'hide_options_from_display_name',
        'customer_service_can_add',
        'price1_name',
        'price1_value',
        'price2_name',
        'price2_value',
        'price3_name',
        'price3_value',
        'price4_name',
        'price4_value',
        'price5_name',
        'price5_value',
        'price6_name',
        'price6_value',
        'price7_name',
        'price7_value',
        'price8_name',
        'price8_value',
        'price9_name',
        'price9_value',
        'price10_name',
        'price10_value',
        'price11_name',
        'price11_value',
        'price12_name',
        'price12_value',
        'price13_name',
        'price13_value',
        'price14_name',
        'price14_value',
        'price15_name',
        'price15_value',
        'item1_sku',
        'item1_qty',
        'item1_badge',
        'item2_sku',
        'item2_qty',
        'item2_badge',
        'item3_sku',
        'item3_qty',
        'item3_badge',
        'item4_sku',
        'item4_qty',
        'item4_badge',
        'item5_sku',
        'item5_qty',
        'item5_badge',
        'item6_sku',
        'item6_qty',
        'item6_badge',
        'item7_sku',
        'item7_qty',
        'item7_badge',
        'item8_sku',
        'item8_qty',
        'item8_badge',
        'item9_sku',
        'item9_qty',
        'item9_badge',
        'item10_sku',
        'item10_qty',
        'item10_badge',
        'item11_sku',
        'item11_qty',
        'item11_badge',
        'item12_sku',
        'item12_qty',
        'item12_badge',
        'item13_sku',
        'item13_qty',
        'item13_badge',
        'item14_sku',
        'item14_qty',
        'item14_badge',
        'item15_sku',
        'item15_qty',
        'item15_badge',
        'item16_sku',
        'item16_qty',
        'item16_badge',
        'item17_sku',
        'item17_qty',
        'item17_badge',
        'item18_sku',
        'item18_qty',
        'item18_badge',
        'item19_sku',
        'item19_qty',
        'item19_badge',
        'item20_sku',
        'item20_qty',
        'item20_badge',
        'item21_sku',
        'item21_qty',
        'item21_badge',
        'item22_sku',
        'item22_qty',
        'item22_badge',
        'item23_sku',
        'item23_qty',
        'item23_badge',
        'item24_sku',
        'item24_qty',
        'item24_badge',
        'item25_sku',
        'item25_qty',
        'item25_badge',
        'item26_sku',
        'item26_qty',
        'item26_badge',
        'item27_sku',
        'item27_qty',
        'item27_badge',
        'item28_sku',
        'item28_qty',
        'item28_badge',
        'item29_sku',
        'item29_qty',
        'item29_badge',
        'item30_sku',
        'item30_qty',
        'item30_badge',
        'item31_sku',
        'item31_qty',
        'item31_badge',
        'item32_sku',
        'item32_qty',
        'item32_badge',
        'item33_sku',
        'item33_qty',
        'item33_badge',
        'item34_sku',
        'item34_qty',
        'item34_badge',
        'item35_sku',
        'item35_qty',
        'item35_badge',
        'item36_sku',
        'item36_qty',
        'item36_badge',
        'item37_sku',
        'item37_qty',
        'item37_badge',
        'item38_sku',
        'item38_qty',
        'item38_badge',
        'item39_sku',
        'item39_qty',
        'item39_badge',
        'item40_sku',
        'item40_qty',
        'item40_badge',
        'sort_order'
    ];

    // Add headers to the sheet
    dashboardUploadSheet.appendRow(headers);



    return dashboardUploadSheet;
}