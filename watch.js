const { exec } = require("child_process");

const compiler = exec("npx tsc --watch", { cwd: __dirname });

compiler.stdout.on("data", (data) => {
  console.log(data);
});

compiler.stderr.on("data", (data) => {
  console.error(data);
});
