const { exec } = require("child_process");

exec("claude refactor-playwright tests/raw-recording.spec.ts", (err, stdout) => {
  console.log(stdout);
});