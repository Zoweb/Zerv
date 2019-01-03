import compile from "@zerv/core";
import * as fs from "fs";

console.log("Compiling...");

fs.readFile("lib/app.ts", "utf8", (err, data) => {
    if (err) throw err;

    const compiled = compile(data);

    console.log("Got result:", compiled, "[EOF]");

    fs.writeFileSync("lib/app.js", compile(data));
});