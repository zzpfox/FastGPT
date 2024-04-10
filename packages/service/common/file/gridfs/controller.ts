import { Types, connectionMongo } from '../../mongo';
import { BucketNameEnum } from '@fastgpt/global/common/file/constants';
import fsp from 'fs/promises';
import fs from 'fs';
import { DatasetFileSchema } from '@fastgpt/global/core/dataset/type';
import { MongoFileSchema } from './schema';
import { detectFileEncoding } from '@fastgpt/global/common/file/tools';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { ReadFileByBufferParams, ReadFileByPR } from '../read/type';
//import { filep } from '../read/type';
import { MongoRwaTextBuffer } from '../../buffer/rawText/schema';
import { readFileRawContent } from '../read/utils';
//import { global } from 'styled-jsx/css';

//export const filep: ReadFileByPR[] = [];

/*namespace filepppp {
  export const x = filep;
}*/


export function getGFSCollection(bucket: `${BucketNameEnum}`) {
  MongoFileSchema;
  return connectionMongo.connection.db.collection(`${bucket}.files`);
}
export function getGridBucket(bucket: `${BucketNameEnum}`) {
  return new connectionMongo.mongo.GridFSBucket(connectionMongo.connection.db, {
    bucketName: bucket
  });
}

//let ffpath: string = "";

/* crud  file */
export async function uploadFile({
  bucketName,
  teamId,
  tmbId,
  path,
  filename,
  contentType,
  metadata = {}
}: {
  bucketName: `${BucketNameEnum}`;
  teamId: string;
  tmbId: string;
  path: string;
  filename: string;
  contentType?: string;
  metadata?: Record<string, any>;
}) {
  if (!path) return Promise.reject(`filePath is empty`);
  if (!filename) return Promise.reject(`filename is empty`);

  const stats = await fsp.stat(path);
  if (!stats.isFile()) return Promise.reject(`${path} is not a file`);

  metadata.teamId = teamId;
  metadata.tmbId = tmbId;

  // create a gridfs bucket
  const bucket = getGridBucket(bucketName);

  const stream = bucket.openUploadStream(filename, {
    metadata,
    contentType
  });

  // save to gridfs
  await new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(stream as any)
      .on('finish', resolve)
      .on('error', reject);
  });
  console.log("34333333333333")
  //global.
  //const filep: ReadFileByPR = {
  //  ffpath:path,
  //  fileId:String(stream.id)
  //};
  //Buffer.from(filep)
  const fp: ReadFileByPR = {
    ffpath: path,
    fileId: String(stream.id),
    findex: 0
  };

  //filep.push(fp)
  //filepppp.x.push(fp);
  //global.filep.push(fp);
  //fp.ffpath = path;
  console.log(path)
  //const fpathhh = require('../read/type');
  //const fileIdd = require('../read/type');
  if (global.fpathhhhhh == undefined) {
    global.fpathhhhhh = []
  }
  global.fpathhhhhh.push(path)
  console.log(String(stream.id))
  if (global.fileIddddd == undefined) {
    global.fileIddddd = []
  }
  global.fileIddddd.push(String(stream.id))
  console.log("55555555555555")

  return String(stream.id);
}

export async function getFileById({
  bucketName,
  fileId
}: {
  bucketName: `${BucketNameEnum}`;
  fileId: string;
}) {
  const db = getGFSCollection(bucketName);
  const file = await db.findOne<DatasetFileSchema>({
    _id: new Types.ObjectId(fileId)
  });

  // if (!file) {
  //   return Promise.reject('File not found');
  // }

  return file || undefined;
}

export async function delFileByFileIdList({
  bucketName,
  fileIdList,
  retry = 3
}: {
  bucketName: `${BucketNameEnum}`;
  fileIdList: string[];
  retry?: number;
}): Promise<any> {
  try {
    const bucket = getGridBucket(bucketName);

    await Promise.all(fileIdList.map((id) => bucket.delete(new Types.ObjectId(id))));
  } catch (error) {
    if (retry > 0) {
      return delFileByFileIdList({ bucketName, fileIdList, retry: retry - 1 });
    }
  }
}

export async function getDownloadStream({
  bucketName,
  fileId
}: {
  bucketName: `${BucketNameEnum}`;
  fileId: string;
}) {
  const bucket = getGridBucket(bucketName);

  return bucket.openDownloadStream(new Types.ObjectId(fileId));
}

export const readFileEncode = async ({
  bucketName,
  fileId
}: {
  bucketName: `${BucketNameEnum}`;
  fileId: string;
}) => {
  const encodeStream = await getDownloadStream({ bucketName, fileId });
  let buffers: Buffer = Buffer.from([]);
  for await (const chunk of encodeStream) {
    buffers = Buffer.concat([buffers, chunk]);
    if (buffers.length > 10) {
      encodeStream.abort();
      break;
    }
  }

  const encoding = detectFileEncoding(buffers);

  return encoding as BufferEncoding;
};

export const readFileContentFromMongo = async ({
  teamId,
  bucketName,
  fileId,
  csvFormat = false
}: {
  teamId: string;
  bucketName: `${BucketNameEnum}`;
  fileId: string;
  csvFormat?: boolean;
}): Promise<{
  rawText: string;
  filename: string;
}> => {
  // read buffer
  const fileBuffer = await MongoRwaTextBuffer.findOne({ sourceId: fileId }).lean();
  if (fileBuffer) {
    return {
      rawText: fileBuffer.rawText,
      filename: fileBuffer.metadata?.filename || ''
    };
  }

  const [file, encoding, fileStream] = await Promise.all([
    getFileById({ bucketName, fileId }),
    readFileEncode({ bucketName, fileId }),
    getDownloadStream({ bucketName, fileId })
  ]);

  if (!file) {
    return Promise.reject(CommonErrEnum.fileNotFound);
  }

  const extension = file?.filename?.split('.')?.pop()?.toLowerCase() || '';

  const fileBuffers = await (() => {
    return new Promise<Buffer>((resolve, reject) => {
      let buffers = Buffer.from([]);
      fileStream.on('data', (chunk) => {
        buffers = Buffer.concat([buffers, chunk]);
      });
      fileStream.on('end', () => {
        resolve(buffers);
      });
      fileStream.on('error', (err) => {
        reject(err);
      });
    });
  })();

  console.log(11111111111)
  // console.log(global.ffpath)
  //根据fileID找path

  //const fpathhh = require('../read/type');
  //const fileIdd = require('../read/type');
  console.log(global.fileIddddd)
  console.log(global.fpathhhhhh)
  //console.log("222222222222222222")
  const index: number = global.fileIddddd.findIndex((element) => element === fileId);
  const fpath = global.fpathhhhhh[index];

  global.fileIddddd.splice(index, 1)
  global.fpathhhhhh.splice(index, 1)
  //const index = 0
  //global.index = index;
  // params.fpath = ffpath;
  console.log(index)
  console.log(fpath)
  const params: ReadFileByBufferParams = {
    teamId,
    index: index,
    fpath: fpath,
    buffer: fileBuffers,
    encoding,
    metadata: {
      relatedId: fileId
    }
  };

  console.log(params.fpath)
  const { rawText } = await readFileRawContent({
    extension,
    csvFormat,
    params
  });

  if (rawText.trim()) {
    MongoRwaTextBuffer.create({
      sourceId: fileId,
      rawText,
      metadata: {
        filename: file.filename
      }
    });
  }

  return {
    rawText,
    filename: file.filename
  };
};
