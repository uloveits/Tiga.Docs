const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const logger = require("./logger.js");
const runSandboxScript = require("./run-sandbox-script.js");
const merge = require("easy-pdf-merge");

const renderPdf = async ({
  mainMdFilename,
  pathToStatic,
  pathToPublic,
  pdfOptions,
  docsifyRendererPort,
  emulateMedia,
  facebookName,
  facebook,
}) => {
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1200,
      height: 1000,
    },
  });
  try {
    const mainMdFilenameWithoutExt = path.parse(mainMdFilename).name;
    const docsifyUrl = `http://localhost:${docsifyRendererPort}/#/${pathToStatic}/${mainMdFilenameWithoutExt}`;
    let pdfUrls = []
    const page = await browser.newPage();

    // 判断是否显示封面  生成封面pdf，并将生成的pdf路径放入pdfUrls数组内
    if (facebook) {
      await page.goto(`http://localhost:${docsifyRendererPort}/${facebookName}`, { waitUntil: "networkidle0" });
      await page.emulateMedia(emulateMedia);
      await page.pdf({
        ...{
          ...pdfOptions,
          margin: {
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px'
          },
        },
        path: path.resolve("facebook.pdf"),
      });
      pdfUrls.push('facebook.pdf')
    }

    // 开始生成文档内容pdf，并将生成的pdf路径放入pdfUrls数组内
    await page.goto(docsifyUrl, { waitUntil: "networkidle0" });
    const renderProcessingErrors = await runSandboxScript(page, {
      mainMdFilenameWithoutExt,
      pathToStatic,
    });
    if (renderProcessingErrors.length)
      logger.warn("anchors processing errors", renderProcessingErrors);
    await page.emulateMedia(emulateMedia);
    await page.pdf({
      ...pdfOptions,
      path: path.resolve(facebook ? 'content.pdf' : pathToPublic),
    });
    pdfUrls.push(facebook ? 'content.pdf' : pathToPublic)

    await browser.close();
    //如果显示封面，执行合并，完成后删除pdfUrls中的pdf。
    if (facebook) {
      await mergeMultiplePDF(pdfUrls, pathToPublic);
      pdfUrls.map(url => fs.unlinkSync(url))
    }
  } catch (e) {
    await browser.close();
    throw e;
  }
};
//调用easy-pdf-merge的api对pdfUrls的pdf进行合并
const mergeMultiplePDF = (pdfFiles, pathToPublic) => {
  return new Promise((resolve, reject) => {
    merge(pdfFiles, pathToPublic, async (err) => {
      if (err) {
        console.log(err);
        reject(err)
      }
      console.log('PDF Merge Success!');
      resolve()
    });
  });
};

const htmlToPdf = ({
  mainMdFilename,
  pathToStatic,
  pathToPublic,
  pdfOptions,
  removeTemp,
  docsifyRendererPort,
  emulateMedia,
  facebookName,
  facebook,
}) => async () => {
  const { closeProcess } = require("./utils.js")({ pathToStatic, removeTemp });
  try {
    return await renderPdf({
      mainMdFilename,
      pathToStatic,
      pathToPublic,
      pdfOptions,
      docsifyRendererPort,
      emulateMedia,
      facebookName,
      facebook,
    });
  } catch (err) {
    logger.err("puppeteer renderer error:", err);
    await closeProcess(1);
  }
};

module.exports = config => ({
  htmlToPdf: htmlToPdf(config),
});