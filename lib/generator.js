/**
 * 处理创建逻辑
 */
// 处理动画相关，比如远程获取等待等等
const ora = require('ora')

const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const fs_extra = require('fs-extra');
// const spawn = require('cross-spawn');

const exec = require('child_process').exec;

const chalk = require('chalk');

const util = require('util')
const downloadGitRepo = require('download-git-repo') 

const { getRepoList, getTagList } = require('./http')

async function loading (fn, msg, ...args) {
  // 使用 ora 初始化，传入提示信息 message
  const loading = ora(msg)

  loading.start()

  try {
    const res = await fn.apply(null, args)
    // 把状态修改为成功
    loading.succeed()
    return res
  } catch(err) {
    // 把状态置为失败
    loading.fail('Request failed')
  }
}

async function copyFile(sourceDir, destinationDir) {
  if (!fs.existsSync(destinationDir)){
    fs.mkdirSync(destinationDir, { recursive: true });
  }
  const copy = util.promisify(fs_extra.copy)

  await copy(sourceDir, destinationDir).then(res => {
    console.log("copy success!");
  }).catch(err => {
    console.log(err)
  })
}

class Generator {
  constructor (name, targetDir) {
    // 目录名称
    this.name = name
    // 文件创建位置
    this.targetDir = targetDir

    this.downloadGitRepo = util.promisify(downloadGitRepo);
  }

  /**
   * 下载远程模板
   * 1、拼接下载地址
   * 2、调用下载方法
   */
  async download(repo, tag) {
    const requestUrl = `houwenli/${repo}${tag?'#'+tag:''}`;
    // 本地下载一份，下次下载直接从备份获取
    await loading(
      this.downloadGitRepo, // 远程下载方法
      'waiting download template', // 加载提示信息
      requestUrl, // 参数1: 下载地址
      path.resolve(__dirname, '../', `./${repo}/v${tag.replace(/\./g, '')}`)
    ) // 参数2: 创建位置

    await copyFile(path.resolve(process.cwd(), `./${repo}/v${tag.replace(/\./g, '')}`), this.targetDir)
  }

  /**
   * 获取用户模板
   * 1、远程获取模板
   * 2、用户自己选择模板信息
   * 3、返回用户的选择
   */
  async getRepo() {
    const repoList = await loading(getRepoList, 'wait a moment，从远程获取模板信息')
    if(!repoList) { return }

    // 过滤我们需要的模板名称
    const repos = repoList
      .filter(item => {
        return item.name.indexOf('template') > -1
      })
      .map(item => item.name)

    const { repo } = await inquirer.prompt([
      {
        name: 'repo',
        type: 'list',
        message: '请选择仓库',
        choices: repos
      }
    ])

    return repo
  }

  /**
   * 获取用户选择的版本，这个和getRepo逻辑基本一样
   * 1、基于repo结果，远程拉取对应的tag列表
   * 2、用户选择自己需要下载的tag
   * 3、返回用户选择的tag
   */
  async getTag(repo) {
    const tagList = await loading(getTagList, 'wait a moment，从远程获取版本信息', repo)

    // 过滤我们需要的模板名称
    const tags = tagList
      .map(item => item.tag_name)

    const { tag } = await inquirer.prompt([
      {
        name: 'tag',
        type: 'list',
        message: '请选择版本',
        choices: tags
      }
    ])

    return tag
  }

  // 创建核心逻辑
  async create() {
    console.log('开始创建目录了')
    const repo = await this.getRepo()

    const tag = await this.getTag(repo)

    console.log(`用户选择了，repo= ${repo}，tag= ${tag}`)

    // 先判断本地模板中有没有用户选择
    // 拼接本地模板路径
    let templatePath = path.resolve(__dirname, '../', `./${repo}/v${tag.replace(/\./g, '')}`)
    if (fs.existsSync(templatePath)){
      await copyFile(templatePath, this.targetDir)
    } else {
      await this.download(repo, tag)
    }


    // 文件下载完成，执行npm install
    console.log('开始执行npm install')
    const execFn = util.promisify(exec)
    await loading(
      execFn, // 执行npm install
      'npm installing...', // 加载提示信息
      `cd ${this.targetDir} && npm install -D `
    ) // 参数2: 创建位置
  }
}

module.exports = Generator