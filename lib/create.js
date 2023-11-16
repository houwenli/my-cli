const path = require('path')
const fs = require('fs-extra')
const inquirer = require('inquirer')

const Generator = require('./generator')


/**
 * 创建cli入口
 * 1、如果目标目录不存在，直接创建目录
 * 2、如果目标目录存在，询问用户是否需要覆盖
 * @param {*} name 
 * @param {*} options 
 */
const createCli = async function(name, options) {
  const cwd = process.cwd()
  // 需要创建的文件目录
  const targetDir = path.join(cwd, name)

  // 查看文件是否存在
  if (fs.existsSync(targetDir)) {
    if (options.force) {
      // 删除目标文件
      await fs.removeSync(targetDir)
    } else {
      // 询问是否删除，用到另一个库inquirer
      console.log('是否需要删除已存在的文件')

      let { action } = await inquirer.prompt([
        {
          name: 'action',
          type: 'list',
          message: '目标目录已经存在，请选择操作方式',
          choices: [
            {
              name: 'Overwrite',
              value: 'overwrite'
            },
            {
              name: 'Cancel',
              value: false
            }
          ]
        }
      ])

      if(!action) {
        return
      } else if(action === 'overwrite') {
        // 移除已存在的目录
        console.log(`\r\nRemoving...`)
        await fs.removeSync(targetDir)
      }

    }
  }

  // 创建项目
  const generator = new Generator(name, targetDir)

  generator.create()
}

// 导出可用代码
module.exports = {
  createCli
}