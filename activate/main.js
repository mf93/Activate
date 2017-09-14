/**
 * Created by mafeld on 9/14/2017.
 */
var CLIEngine = require("eslint").CLIEngine;
var path = require('path');

// module.exports = function(){

    var cli = new CLIEngine({
        envs: ['es6', 'node'],
        useEslintrc: false,
        // ignore: false,
        rulePaths: [path.resolve(__dirname, 'rules/')],
        rules: {
            "functionMapper": 1,
        }
    });

    var report = cli.executeOnFiles([process.argv[2]]);
    console.log(JSON.stringify(report));
    var formatter = cli.getFormatter();

    console.log(formatter(report.results));

// }