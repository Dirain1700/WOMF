"use strict";

const fs = require("node:fs");
const path = require("node:path");
const filePath = path.resolve(__dirname, "index.js");

const indexJS = fs.readFileSync(filePath, "utf-8");

const errorDetectionScript = `window.onerror=(message,file,lineNo,colNo)=>{if(message!=="Script error.")alert("Please report this to developer:\\n"+[message,file,lineNo,colNo].join("\\n"));},`;

fs.writeFileSync(filePath, errorDetectionScript + indexJS);
