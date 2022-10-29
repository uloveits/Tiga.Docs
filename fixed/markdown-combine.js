const fs = require("fs");
const util = require("util");
const path = require("path");
const logger = require("./logger.js");
const processImagesPaths = require("./process-images-paths.js");
const processInnerLinks = require("./process-inner-links.js");

const [readFile, writeFile, exists] = [fs.readFile, fs.writeFile, fs.exists].map(fn =>
  util.promisify(fn),
);

const combineMarkdowns = ({ contents, pathToStatic, mainMdFilename, mkdir }) => async links => {
  let contentsPaths = Array.isArray(contents) ? contents : [contents];
  //判断是否显示目录，将docsifytopdfrc.js中的contents配置的目录文件添加到文档内容中（默认没有添加进去）
  const _contentsPath = contentsPaths[0]

  mkdir && links.unshift(_contentsPath)

  //根据docsifytopdfrc.js中的contents获取其绝对路径
  const dir = path.resolve(_contentsPath);
 
  try {
    const files = await Promise.all(
      await links.map(async filename => {
       
        const dirFileName = path.resolve(`./${filename}`);
        
        const fileExist = await exists(dirFileName);

        if (fileExist) {
          const content = await readFile(dirFileName, {
            encoding: "utf8",
          });

          return {
            content,
            name: dirFileName,
          };
        }

        throw new Error(`file ${filename} is not exist, but listed in ${contents}`);
      }),
    );

    const resultFilePath = path.resolve(pathToStatic, mainMdFilename);

    try {
      const content = files
        //将项目绝对路径传递给内部锚点设置函数processInnerLinks，因为此函数在对内部锚点链接对比时，要求必须是绝对路径，而在源文档中设置的内部跳转链接多数为相对路径，所以需要路径拼接的操作
        .map((...rest) => processInnerLinks(dir, ...rest))
        .map(processImagesPaths({ pathToStatic }))
        .join("\n\n\n\n\n\n");

      //判断是否显示了目录 设置头部目录标题
      await writeFile(resultFilePath, (mkdir ? '# **目录** \r\n' : '') + content);
    } catch (e) {
      logger.err("markdown combining error", e);
      throw e;
    }

    return resultFilePath;

  } catch (err) {
    logger.err("combineMarkdowns", err);
    throw err;
  }
};

module.exports = config => ({
  combineMarkdowns: combineMarkdowns(config),
});
