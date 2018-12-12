#!/usr/bin/env node

/*! Neo's Password Manager */

const commander = require('commander');

const packageJson   = require('./package.json');
const constants     = require('./lib/constants');
const commandAdd    = require('./lib/command-add');
const commandGet    = require('./lib/command-get');
const commandGetAll = require('./lib/command-get-all');
const commandRm     = require('./lib/command-rm');


// 環境変数が定義されていなければ何もしない
if(process.env[constants.masterPassName] === undefined || process.env[constants.masterPassName].length === 0) {
  return console.error(`Error: マスターパスワードを環境変数 ${constants.masterPassName} で指定してください`);
}

// Command Description
commander.description('save and load the private data from a JSON file');

// Version
commander.version(packageJson.version, '-v, --version');

// Add
commander
  .command('add <service_name>')
  .alias('a')
  .description('add or update data to JSON file')
  .option('-i, --id <id>'    , 'ID')
  .option('-p, --pass <pass>', 'Password')
  .option('-m, --mail <mail>', 'E-mail')
  .option('-u, --url <url>'  , 'URL')
  .option('-t, --text <text>', 'Text')
  .action((serviceName, cmd) => {
    (async () => {
      await commandAdd(serviceName, cmd);
    })();
  });

// Get
commander
  .command('get [query]')
  .alias('g')
  .description('find data from JSON file')
  .option('-i, --id <id>'    , 'ID')
  .option('-p, --pass <pass>', 'Password')
  .option('-m, --mail <mail>', 'E-mail')
  .option('-u, --url <url>'  , 'URL')
  .option('-t, --text <text>', 'Text')
  .action((query, cmd) => {
    (async () => {
      await commandGet(query, cmd);
    })();
  });

// Get-All
commander
  .command('get-all')
  .alias('l')
  .description('output all data from JSON file')
  .action(() => {
    (async () => {
      await commandGetAll();
    })();
  });

// Rm
commander
  .command('rm <service_name>')
  .alias('r')
  .option('-i, --id <id>'    , 'ID')
  .option('-m, --mail <mail>', 'E-mail')
  .description('remove data from JSON file')
  .action((serviceName, cmd) => {
    (async () => {
      await commandRm(serviceName, cmd);
    })();
  });

// パースする
commander.parse(process.argv);

// 引数がなければヘルプを表示する
if(commander.args.length === 0) {
  commander.help();
}
