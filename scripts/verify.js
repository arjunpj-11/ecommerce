const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ejs = require("ejs");

const projectRoot = path.resolve(__dirname, "..");
const sourceDirectories = [
  "config",
  "controllers",
  "middlewares",
  "models",
  "public/javascripts",
  "routes",
  "utilities",
];
const entryFiles = ["app.js", "bin/www", "seed.js"];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

function verifyJavaScript(file) {
  const source = fs.readFileSync(file, "utf8");
  new vm.Script(source, { filename: file });
}

function verifyTemplate(file) {
  ejs.compile(fs.readFileSync(file, "utf8"), { filename: file });
}

const javascriptFiles = [
  ...entryFiles.map((file) => path.join(projectRoot, file)),
  ...sourceDirectories.flatMap((directory) =>
    walk(path.join(projectRoot, directory)).filter((file) =>
      file.endsWith(".js"),
    ),
  ),
];
const templateFiles = walk(path.join(projectRoot, "views")).filter((file) =>
  file.endsWith(".ejs"),
);

const failures = [];

for (const file of javascriptFiles) {
  try {
    verifyJavaScript(file);
  } catch (error) {
    failures.push(`${path.relative(projectRoot, file)}: ${error.message}`);
  }
}

for (const file of templateFiles) {
  try {
    verifyTemplate(file);
  } catch (error) {
    failures.push(`${path.relative(projectRoot, file)}: ${error.message}`);
  }
}

if (failures.length) {
  console.error("Verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${javascriptFiles.length} JavaScript files and ${templateFiles.length} EJS templates.`,
  );
}
