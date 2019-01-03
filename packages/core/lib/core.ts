import * as tsc from "typescript-compiler";

export default function compile(input: string) {
    console.log("The input is:", input);

    return tsc.compileString(input, "--lib esnext,dom,es2015 --module amd", {}, err => {
        console.error("Type error:", err.formattedMessage);
        const lineAndChar =
            err.formattedMessage
                .substring(err.formattedMessage.indexOf("(") + 1, err.formattedMessage.indexOf(")"))
                .split(",")
                .map(it => parseInt(it));

        const lines = err.file.text.split("\n");
        const startLine = Math.max(0, lineAndChar[0] - 5);
        const endLine = Math.min(lines.length - 1, lineAndChar[0] + 5);

        const croppedLines = lines.slice(startLine, endLine);

        const outputLines = [];
        for (let i = 0; i < croppedLines.length; i++) {
            outputLines.push(lines[i]);

            if (i + startLine === lineAndChar[0] - 1) {
                outputLines.push("-".repeat(lineAndChar[1] - 1) + "^");
            }
        }

        console.error(" in", err.file.filename);
        console.error("\n\n...\n" + outputLines.join("\n") + "\n...\n\n");
        process.exit(1);
    });
};