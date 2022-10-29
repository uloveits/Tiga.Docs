#!/usr/bin/env node

const fs = require('fs');
const fse = require('fs-extra')
const path = require('path');
 
// 根目录
let BASEPATHURL = path.resolve(__dirname, '.')
 
// 移动目录
let startFileDirectory = `${BASEPATHURL}/fixed`
// 放置目录
let endFileDirectory =`${BASEPATHURL}/node_modules/docsify-pdf-converter/src`


deleteFile(endFileDirectory,'markdown-combine')
deleteFile(endFileDirectory,'process-inner-links')
deleteFile(endFileDirectory,'render')

copyFile(`${startFileDirectory}/markdown-combine.js`,`${endFileDirectory}/markdown-combine.js`)
copyFile(`${startFileDirectory}/process-inner-links.js`,`${endFileDirectory}/process-inner-links.js`)
copyFile(`${startFileDirectory}/render.js`,`${endFileDirectory}/render.js`)
copyFile(`${startFileDirectory}/cli.js`,`${endFileDirectory}/cli.js`)


/**
 * 删除某一个包下面的需要符合格式的文件。
 * @param  {String} url  文件路径，绝对路径
 * @param  {String} name 需要删除的文件名称
 */
 function deleteFile(url,name){
    var files = [];
    if(fs.existsSync(url)) {    //判断给定的路径是否存在
           
        files = fs.readdirSync(url);    //返回文件和子目录的数组

        files.forEach(function(file,index){

            var curPath = path.join(url,file);

            if(fs.statSync(curPath).isDirectory()) { //同步读取文件夹文件，如果是文件夹，则函数回调
                deleteFile(curPath,name);
            } else {   
                if(file.indexOf(name)>-1){    //是指定文件，则删除
                    fs.unlinkSync(curPath);
                    console.log("删除文件："+curPath);
                }
            }  
        });
    }else{
        console.log("给定的路径不存在！");
    }

}


// 复制文件
function copyFile(srcPath, tarPath) {
    try {
        fse.copySync(srcPath, tarPath)
        console.log('复制文件：',srcPath)
      } catch (err) {
        console.error(err)
    }
}
