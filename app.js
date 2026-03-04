/* ═══════════════════════════════════════════
   DMS API Test Panel — app.js
═══════════════════════════════════════════ */

var _app    = function() { return document.getElementById("cfg-app").value.trim(); };
var _report = function() { return document.getElementById("cfg-report").value.trim(); };

// ── Helper: render result into a section ──
function renderResult(elID, rows, rawData) {
  var el  = document.getElementById(elID);
  var html = rows.map(function(r) {
    return "<div class=\"test-row\">" +
      "<span class=\"test-label\">" + r.label + "</span>" +
      "<span class=\"" + r.cls + "\">" + r.value + "</span>" +
      "</div>";
  }).join("");

  if(rawData !== undefined) {
    html += "<div class=\"raw-box\">" +
      JSON.stringify(rawData, null, 2) + "</div>";
  }
  el.innerHTML = html;
}

function loading(elID, msg) {
  document.getElementById(elID).innerHTML =
    "<div class=\"test-row\"><span class=\"spinner\"></span>" +
    "<span style=\"font-size:.78rem;color:#546e7a;\">" + (msg || "Running...") + "</span></div>";
}

function badge(text, type) {
  return "<span class=\"badge badge-" + type + "\">" + text + "</span>";
}

function resultVal(text) {
  return "<span class=\"result-value\">" + escHTML(String(text)) + "</span>";
}

function resultErr(text) {
  return "<span class=\"result-error\">" + escHTML(String(text)) + "</span>";
}

function escHTML(str) {
  return String(str || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ──────────────────────────────────────────
   TEST 1 — Init & fetch 1 record
────────────────────────────────────────── */
function runTest1() {
  loading("test1-result", "Initialising ZOHOCREATOR and fetching 1 record...");

  ZOHOCREATOR.init().then(function() {
    return ZOHOCREATOR.data.getRecords({
      appLinkName:    _app(),
      reportLinkName: _report(),
      page:           1,
      pageSize:       1
    });
  }).then(function(response) {
    var ok      = response && response.data && response.data.length > 0;
    var recCount = ok ? response.data.length : 0;
    renderResult("test1-result", [
      { label: "ZOHOCREATOR.init()",  cls: "badge badge-pass", value: "✓ Success" },
      { label: "App link name",        cls: "result-value",     value: _app() },
      { label: "Report link name",     cls: "result-value",     value: _report() },
      { label: "Records returned",     cls: ok ? "badge badge-pass" : "badge badge-fail",
        value: ok ? "✓ " + recCount + " record(s) found" : "✗ 0 records — check report name" }
    ]);
  }).catch(function(err) {
    renderResult("test1-result", [
      { label: "ZOHOCREATOR.init()",  cls: "badge badge-fail", value: "✗ Failed" },
      { label: "Error",                cls: "result-error",     value: JSON.stringify(err) }
    ]);
  });
}

/* ──────────────────────────────────────────
   TEST 2 — Count queries
────────────────────────────────────────── */
function runTest2() {
  loading("test2-result", "Running count queries...");

  ZOHOCREATOR.init().then(function() {
    var criteria = "Archive == false && (Document_Status == \"Published\" || Document_Status == \"For Review\" || Document_Status == \"Under Review\")";
    return ZOHOCREATOR.data.getRecords({
      appLinkName:    _app(),
      reportLinkName: _report(),
      criteria:       criteria,
      page:           1,
      pageSize:       1000
    });
  }).then(function(response) {
    var records = (response && response.data) ? response.data : [];
    var count   = records.length;
    renderResult("test2-result", [
      { label: "Method used",         cls: "badge badge-info",  value: "getRecords (count via .length)" },
      { label: "Published docs count", cls: "badge badge-pass", value: "✓ " + count + " records" },
      { label: "Note", cls: "result-value",
        value: "getRecordCount() may not be available — using getRecords length as fallback" }
    ]);
  }).catch(function(err) {
    renderResult("test2-result", [
      { label: "Count query", cls: "badge badge-fail", value: "✗ Failed" },
      { label: "Error",       cls: "result-error",     value: JSON.stringify(err) }
    ]);
  });
}

/* ──────────────────────────────────────────
   TEST 3 — Field name verification
────────────────────────────────────────── */
function runTest3() {
  loading("test3-result", "Fetching 1 record to verify field names...");

  var expectedFields = [
    "ID",
    "Document_Name",
    "Document_Control_Registry",
    "Document_Type",
    "Department_Owner_Name",
    "Document_Owner",
    "Document_Status",
    "Effectivity_Date",
    "Version_Number",
    "Revision_Number",
    "Archive",
    "Company_Wide",
    "ZWD_ID",
    "Tracker",
    "Audit_Trail",
    "Read_By",
    "Downloadable"
  ];

  ZOHOCREATOR.init().then(function() {
    return ZOHOCREATOR.data.getRecords({
      appLinkName:    _app(),
      reportLinkName: _report(),
      page:           1,
      pageSize:       1
    });
  }).then(function(response) {
    var rec = (response && response.data && response.data[0]) ? response.data[0] : null;

    if(!rec) {
      renderResult("test3-result", [
        { label: "Field check", cls: "badge badge-fail",
          value: "✗ No records returned — cannot verify fields" }
      ]);
      return;
    }

    var actualKeys = Object.keys(rec);

    var rows = [
      { label: "Record fetched", cls: "badge badge-pass", value: "✓ ID: " + rec.ID }
    ];

    var pillsHTML = "<div id=\"field-list\">";
    expectedFields.forEach(function(f) {
      var found = actualKeys.indexOf(f) > -1 || rec.hasOwnProperty(f);
      pillsHTML += "<span class=\"field-pill" + (found ? "" : " missing") + "\">" +
        (found ? "✓ " : "✗ ") + f + "</span>";
    });
    pillsHTML += "</div>";

    rows.push({
      label: "Expected fields",
      cls:   "result-value",
      value: "See colour-coded pills below (green = found, red = missing)"
    });

    renderResult("test3-result", rows);
    document.getElementById("test3-result").innerHTML += pillsHTML;
    document.getElementById("test3-result").innerHTML +=
      "<div style=\"margin-top:.75rem;font-size:.72rem;color:#546e7a;\">" +
      "All keys in response: <br/><span class=\"result-value\">" +
      escHTML(actualKeys.join(", ")) + "</span></div>";
  }).catch(function(err) {
    renderResult("test3-result", [
      { label: "Field check", cls: "badge badge-fail", value: "✗ Failed" },
      { label: "Error",       cls: "result-error",     value: JSON.stringify(err) }
    ]);
  });
}

/* ──────────────────────────────────────────
   TEST 4 — Update a record (write test)
────────────────────────────────────────── */
function runTest4() {
  var recID = document.getElementById("cfg-recid").value.trim();
  var field = document.getElementById("cfg-field").value.trim();
  var value = document.getElementById("cfg-value").value.trim();

  if(!recID) {
    document.getElementById("test4-result").innerHTML =
      "<span class=\"result-error\">Please enter a Record ID first.</span>";
    return;
  }

  loading("test4-result", "Attempting record update...");

  var fieldData = {};
  fieldData[field] = value;

  ZOHOCREATOR.init().then(function() {
    return ZOHOCREATOR.data.updateRecord({
      appLinkName:    _app(),
      reportLinkName: _report(),
      id:             recID,
      fieldData:      fieldData
    });
  }).then(function(response) {
    renderResult("test4-result", [
      { label: "Update result", cls: "badge badge-pass", value: "✓ Success" },
      { label: "Record ID",     cls: "result-value",     value: recID },
      { label: "Field updated", cls: "result-value",     value: field + " → " + value }
    ], response);
  }).catch(function(err) {
    renderResult("test4-result", [
      { label: "Update result", cls: "badge badge-fail", value: "✗ Failed" },
      { label: "Record ID",     cls: "result-value",     value: recID },
      { label: "Error",         cls: "result-error",     value: JSON.stringify(err) }
    ]);
  });
}

/* ──────────────────────────────────────────
   TEST 5 — Current logged-in user
────────────────────────────────────────── */
function runTest5() {
  loading("test5-result", "Fetching current user info...");

  ZOHOCREATOR.init().then(function() {
    return ZOHOCREATOR.meta.getAppDetails({
      appLinkName: _app()
    });
  }).then(function(response) {
    renderResult("test5-result", [
      { label: "App details",    cls: "badge badge-pass", value: "✓ Retrieved" },
      { label: "Response",       cls: "result-value",     value: JSON.stringify(response) }
    ]);
  }).catch(function(err) {
    // Try alternative — current user via config
    ZOHOCREATOR.config.currentUser().then(function(user) {
      renderResult("test5-result", [
        { label: "Current user method", cls: "badge badge-pass",  value: "✓ config.currentUser()" },
        { label: "Email",               cls: "result-value",      value: user.email || JSON.stringify(user) }
      ]);
    }).catch(function(err2) {
      renderResult("test5-result", [
        { label: "getAppDetails",   cls: "badge badge-fail", value: "✗ Failed" },
        { label: "currentUser()",   cls: "badge badge-fail", value: "✗ Also failed" },
        { label: "Error 1",         cls: "result-error",     value: JSON.stringify(err) },
        { label: "Error 2",         cls: "result-error",     value: JSON.stringify(err2) }
      ]);
    });
  });
}

/* ──────────────────────────────────────────
   TEST 6 — Raw response inspector
────────────────────────────────────────── */
function runTest6() {
  loading("test6-result", "Fetching raw record response...");

  ZOHOCREATOR.init().then(function() {
    return ZOHOCREATOR.data.getRecords({
      appLinkName:    _app(),
      reportLinkName: _report(),
      page:           1,
      pageSize:       1
    });
  }).then(function(response) {
    renderResult("test6-result", [
      { label: "Raw response", cls: "badge badge-pass", value: "✓ See below" }
    ], response);
  }).catch(function(err) {
    renderResult("test6-result", [
      { label: "Raw fetch", cls: "badge badge-fail", value: "✗ Failed" },
      { label: "Error",     cls: "result-error",     value: JSON.stringify(err) }
    ]);
  });
}