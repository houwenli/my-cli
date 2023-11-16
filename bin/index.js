#!/usr/bin/env node
const pkg = require('../package.json')
const createLib = require('../lib/create')

const program = require('commander')
const chalk = require('chalk')
const figlet = require('figlet')

program
  .command('create <app-name>')
  .description('create a new project')
  .option('-f, --force', '目标文件存在，强制重写目标文件')
  .action((name, options) => {
    // 开始创建
    createLib.createCli(name, options)
  })

program
  .version(`v${pkg.version}`)
  .usage('<command> [option]')

program
  .on('--help', () => {
    console.log('\r\n' + figlet.textSync('my-cli', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true
    }) + '\r\n');

    console.log(`Run ${chalk.red('my-cli create <app-name>')},to create your cli`)
  })


// 解析用户执行命令传入参数
program.parse(process.argv)