// Babel config for CLI version only
// Next.js uses its own transpilation and ignores this file
// Using .cjs extension so it's explicitly CommonJS (works with "type": "module" in package.json)
module.exports = {
  presets: [
    ["@babel/preset-env", {
      modules: false
    }],
    "@babel/preset-react"
  ]
};
