const path = require("path");
const markdownLinkExtractor = require("markdown-link-extractor");
const unified = require("unified");
const parser = require("remark-parse");
// dir 取自配置文件.docsifytopdfrc.js中_sidebar.md文件的路径
module.exports = (dir, { content, name }, _, arr) => {
  let newContent = content;

  markdownLinkExtractor(content)
    .filter(link => {
      return path.parse(link).ext === ".md"
    })
    // 下面map是为了过滤出有内部链接的文档，此处对相对路径和绝对路径做了拼接，为了保证所有链接对比时都使用绝对路径
    .map(link => {
      let temp = link.indexOf('/') !== 0 ? '/' + link : link

      return {
        // arr中的name即为在_sidebar中声明的链接，且已拼接根路径
        file: arr.find(({ name }) => name.includes(temp)), link
      }
    })
    .filter(({ file }) => file)
    .map(({ file: { content }, link }) => ({
      ast: unified()
        .use(parser)
        .parse(content),
      link,
    }))
    //找出每个内部链接对应的文档的标题
    .map(({ ast, link }) => {
      // 获取头部内容，要求第一个必须为标题，且不能有html代码包裹
      // 可以有md标签如 ## 或 ** 包裹
      const [a] = ast.children.filter(({ type, children }) => {
        return type === "heading"
      });
      let value = ''
      let temp = a.children.find(obj => obj.type === "text")
      if (temp) {
        value = temp.value
      } else if (a.children[0] && a.children[0].children) {
        temp = a.children[0].children.find(obj => obj.type === "text");
        value = temp.value
      }
      return { link, unsafeTag: value };
    })
    .map(({ unsafeTag, link }) => ({
      link,
      tagWord: unsafeTag.replace(/[&/\#,+()$~%.'":*?<>{}]/g, "").replace(/\s/g, "-"),
    }))
    .map(({ link, tagWord }) => ({
      link,
      tag: `#${tagWord}`,
    }))
    // 把所有内容中的内部链接替换为标题，其效果如下：
    // - [产品简介](/zh-cn/chapter1/test1.md)   替换后  - [产品简介](#产品简介)
    // 如此以来最终文档内将没有实际链接存在，仅剩对各文档标题的锚点关联
    .forEach(({ tag, link }) => {
      // content中的链接\已被转义为\  下面要进行替换 先把link中\替换为\  否则匹配不到
      // link = link.replace(/\/g, '\\')
      newContent = newContent.replace(link, tag)
    });
  return { content: newContent, name };
};