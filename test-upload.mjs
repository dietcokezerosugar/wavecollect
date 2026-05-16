import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

async function test() {
  const form = new FormData();
  form.append("file", fs.createReadStream("C:\\CODE PROJECTS\\transactions_report_BCR2DN6D5P3M5ND5_1778936757244.csv"));

  // We need to pass the session cookie. Since we are testing from CLI, we might get Unauthorized.
  // Let's just see if we get JSON or HTML.
  const res = await fetch("http://localhost:3000/api/staff/reconciliation", {
    method: "POST",
    body: form
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text.substring(0, 500));
}

test();
