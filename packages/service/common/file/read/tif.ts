import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import util from 'util';

// @ts-ignore
import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
import { ReadFileByBufferParams, ReadFileResponse } from './type';
import { removeFilesByPaths } from '../utils';

type TokenType = {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
};

export const readtifFile = async ({
  fpath,
  index,
  buffer
}: ReadFileByBufferParams): Promise<ReadFileResponse> => {

  console.log(buffer.toString().length)
  //console.log(global.ffpath)


  const pageTextPromises: any[] = [];
  const pageTextPromises_: any[] = [];


  let pageTexts;

  // if (pageTextss.toString().length < 100)
  {
    const iconv = require('iconv-lite');
    const child_process = require('child_process');
    const exec = util.promisify(child_process.exec);


    try {

      const { stdout, stderr } = await exec('python ../../python/document_loaders/mypdfloader.py ' + fpath, { encoding: 'buffer' })//global.ffpath
      //const { stdout, stderr } = await exec('python ../../python/deepdoc/vision/rag/app/picture.py ' + fpath, { encoding: 'buffer' })

      //console.log(stdout);
      if (stderr) console.error(stderr);
      let out = iconv.decode(stdout, 'GBK')// stdout.toString('utf8')
      console.log(out)
      pageTextPromises_.push(out);
      console.log(pageTextPromises_.toString().length)

    } catch (error) {
      console.error(' error:', error)
    }





    /*    const result = await exec('python ../../python/document_loaders/mypdfloader.py ' + global.ffpath,
          function (error: { stack: any; code: string; signal: string; }, stdout: string, stderr: string) {
            if (error) {
              console.log(error.stack); console.log('Error code: ' + error.code);
              console.log('Signal received: ' + error.signal);
            }
            // console.log('stdout: ' + stdout);
            //console.log('stderr: ' + stderr);
     
            pageTextPromises_.push(stdout);
            console.log(pageTextPromises_.toString().length)
          });
        result.on('exit', function (code: string,) {
          console.log('子进程已退出，退出码 ' + code);
        });*/
    console.log("3333333333333333333")
    pageTexts = pageTextPromises_;
    console.log(pageTexts.toString().length)
    //pageTexts = stdout;
  }
  //let pageTexts = [];
  //判断页码是否小于1，小于则调用OCR
  //if (doc.numPages < 1) 
  // {
  //console.log(doc.numPages)
  /*if (pageTexts.toString().length < 100) {//console.log(buffer.toString())
    //console.log()
    const child_process = require('child_process');
    //for (var i = 0; i < 3; i++) {//创建三个子进程
    var workerProcess = child_process.exec('python ../../python/document_loaders/mypdfloader.py ' + global.ffpath, async function (error: { stack: any; code: string; signal: string; }, stdout: string, stderr: string) {
      if (error) {
        console.log(error.stack); console.log('Error code: ' + error.code); console.log('Signal received: ' + error.signal);
      }
      console.log('stdout: ' + stdout);

      console.log('stderr: ' + stderr);

      pageTextPromises_.push(stdout);
      const pageTexts = await Promise.all(pageTextPromises_);
    });
    await workerProcess.on('exit', function (code: string) {
      console.log('子进程已退出，退出码 ' + code);

    });* /

  }


  //const spawnap = require('child_process')
  //const py = spawnap.spawn('python3', ['../../python/add.py.py', 3])//global.ffpath
  //D:/docker/fastgpt/FastGPT/python/document_loaders/mypdfloader.py
  //../../../../../python/document_loaders/mypdfloader.py

  //const spawn = require('child_process').spawn
  //const py = spawn('python', ['a.py'])

  //console.log('start…………')

  /*py.stdout.on('data', function (res: { toString: () => any; }) {
    let data = res.toString();
    console.log('stdout: ', data);
    pageTextPromises.push(data)
  })
  py.stderr.on('data', function (res: { toString: () => any; }) {
    let data = res.toString();
    console.log('stderr: ', data)
  })
  py.on('close', (code: any) => {
    console.log(`子进程退出：退出代码code ${code}`);
  });

}*/
  //else
  //{
  //

  let fpaths: string[] = [];
  // fpaths.push(global.ffpath);
  fpaths.push(fpath);
  //  loadingTask.destroy();
  console.log(pageTexts.toString().length)
  removeFilesByPaths(fpaths);
  return {
    rawText: pageTexts.join(''),
    metadata: {}
  };

};
