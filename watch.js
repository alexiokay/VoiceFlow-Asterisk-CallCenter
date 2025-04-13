import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compiler = exec("npm tsc --watch", { cwd: __dirname });

compiler.stdout.on("data", (data) => {
  console.log(data);
});

compiler.stderr.on("data", (data) => {
  console.error(data);
});
