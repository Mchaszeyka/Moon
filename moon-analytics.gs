/**
 * Moon Analytics — Google Apps Script
 * 
 * SETUP:
 * 1. script.google.com → New project → Name it "Moon Analytics"
 * 2. Paste this file
 * 3. Deploy → New deployment → Web app
 *    Execute as: Me | Who has access: Anyone
 * 4. Copy the web app URL
 * 5. Add to your script tag: data-analytics="YOUR_URL"
 */

const SHEET_NAME = "Moon Sessions";

const COLUMNS = [
  "Timestamp","Local Time","Session ID","Event","Session Duration","Time Since Last",
  "Page URL","Page Path","Page Title",
  "Referrer","Referrer Domain",
  "UTM Source","UTM Medium","UTM Campaign","UTM Content","UTM Term",
  "Device Type","Screen W","Screen H","Viewport W","Viewport H","Language","Timezone","Day","Hour",
  "Messages","Fit Score","First Message","All Queries","Current Query",
  "Pages Visited","Page Count",
  "Booking Offered","Booking Clicked","Booked Slot",
  "User Agent"
];

function doPost(e) {
  try {
    logEvent(JSON.parse(e.postData.contents));
    return ContentService.createTextOutput(JSON.stringify({status:"ok"})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:"error",message:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  const headers = rows[0];
  const data = rows.slice(1).reverse().slice(0,200).map(row => {
    const obj = {}; headers.forEach((h,i) => obj[h]=row[i]); return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function logEvent(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    const h = sheet.getRange(1,1,1,COLUMNS.length);
    h.setFontWeight("bold"); h.setBackground("#1c1c1a"); h.setFontColor("#fff"); h.setFontSize(9);
    sheet.setFrozenRows(1); sheet.setFrozenColumns(4);
    [1,2,3,4,7,10,28,29,31].forEach((c,i) => sheet.setColumnWidth(c,[160,140,120,120,200,160,200,300,200][i]));
  }

  sheet.appendRow([
    d.timestamp ? new Date(d.timestamp) : new Date(),
    d.localTime||"", d.sessionId||"", d.event||"",
    d.sessionDuration||"", d.timeSinceLastEvent||"",
    d.pageUrl||"", d.pagePath||"", d.pageTitle||"",
    d.referrer||"direct", d.referrerDomain||"direct",
    d.utm_source||"", d.utm_medium||"", d.utm_campaign||"", d.utm_content||"", d.utm_term||"",
    d.deviceType||"", d.screenWidth||"", d.screenHeight||"",
    d.viewportWidth||"", d.viewportHeight||"",
    d.language||"", d.timezone||"", d.dayOfWeek||"",
    d.hourOfDay!==undefined?d.hourOfDay:"",
    d.messageCount||0, d.fitScore||"",
    d.firstMessage||"", d.allQueries||"", d.currentQuery||"",
    d.pagesVisited||"", d.pageCount||1,
    d.bookingOffered?"Yes":"No", d.bookingClicked?"Yes":"No", d.bookedSlot||"",
    (d.userAgent||"").slice(0,200)
  ]);

  const lastRow = sheet.getLastRow();
  const colors = {
    widget_loaded:   ["#f8f8f8","#888"], widget_opened:   ["#eff6ff","#1d4ed8"],
    session_start:   ["#f0fdf4","#16a34a"], message_sent: ["#fafafa","#555"],
    booking_offered: ["#fefce8","#ca8a04"], booking_clicked:["#dcfce7","#15803d"],
    widget_closed:   ["#fef2f2","#dc2626"]
  };
  const c = colors[d.event||""];
  if (c) {
    sheet.getRange(lastRow,1,1,COLUMNS.length).setBackground(c[0]);
    sheet.getRange(lastRow,4).setFontColor(c[1]);
  }
}

function testLog() {
  logEvent({
    timestamp:Date.now(), localTime:new Date().toLocaleString(),
    sessionId:"test-abc123", event:"session_start",
    sessionDuration:"12s", timeSinceLastEvent:"3s",
    pageUrl:"https://miachaszeyka.com/", pagePath:"/",
    pageTitle:"Mia Chaszeyka — Marketing Systems",
    referrer:"https://linkedin.com", referrerDomain:"linkedin.com",
    utm_source:"linkedin", utm_medium:"social", utm_campaign:"portfolio-2026",
    deviceType:"desktop", screenWidth:1440, screenHeight:900,
    viewportWidth:1200, viewportHeight:800,
    language:"en-US", timezone:"America/Chicago",
    dayOfWeek:"Friday", hourOfDay:14,
    messageCount:1, fitScore:8,
    firstMessage:"We are a 200-person B2B SaaS using HubSpot",
    allQueries:"We are a 200-person B2B SaaS using HubSpot",
    currentQuery:"We are a 200-person B2B SaaS using HubSpot",
    pagesVisited:"/ → /work → /about", pageCount:3,
    bookingOffered:true, bookingClicked:false, bookedSlot:"",
    userAgent:"Mozilla/5.0 Chrome/124.0"
  });
  Logger.log("Test event logged. Check the Moon Sessions sheet.");
}
