// 通过 axios 处理请求
// github暴露的常用api汇总
// https://www.cnblogs.com/ygunoil/p/13607491.html

const axios = require('axios')

axios.interceptors.response.use(res => {
  return res.data
})


/**
 * 获取模板列表
 */
async function getRepoList() {
  return axios.get('https://api.github.com/users/houwenli/repos')
}

/**
 * 获取版本列表
 */
async function getTagList(repo) {
  return axios.get(`https://api.github.com/repos/houwenli/${repo}/releases`)
}

module.exports = {
  getRepoList,
  getTagList
}