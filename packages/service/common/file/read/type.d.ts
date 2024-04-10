//import { global } from "styled-jsx/css";

export type ReadFileByBufferParams = {
  teamId: string;
  index: number;
  fpath: string;
  buffer: Buffer;
  encoding: BufferEncoding;
  metadata?: Record<string, any>;
};

export type ReadFileResponse = {
  rawText: string;
  formatText?: string;
  metadata?: Record<string, any>;
};

export type ReadFileByPR = {
  ffpath: string;
  fileId: string;
  findex: number;
};



const filepp: ReadFileByPR = {
  ffpath,
  fileId,
  findex: 0
};
const fileIdd: string[] = [];
const fpathhh: string[] = [];
module.exports = fileIdd;
module.exports = fpathhh;
//export const fpathhh: string[] = [];


//global.filep = "1111111"//ReadFileByPR[];// = [];

//declare global {
// const filep: ReadFileByPR[] = [];
//}
/*
  var filep: ReadFileByPR = {
    ffpath,
    fileId,
    findex: 0
  };


  //const filep: ReadFileByPR;
  //const fileId: string[];
  //  var index: number;
}
*/
declare global {
  var aaaaa: string;
  var fileIddddd: string[] = [];// new Array(255).fill('');
  var fpathhhhhh: string[] = [];// new Array(255).fill('');
}