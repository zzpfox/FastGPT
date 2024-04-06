/* 
    Create one dataset collection
*/
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { TextCreateDatasetCollectionParams } from '@fastgpt/global/core/dataset/api.d';
import { authDataset } from '@fastgpt/service/support/permission/auth/dataset';
import { createOneCollection } from '@fastgpt/service/core/dataset/collection/controller';
import {
  TrainingModeEnum,
  DatasetCollectionTypeEnum
} from '@fastgpt/global/core/dataset/constants';
import { splitText2Chunks } from '@fastgpt/global/common/string/textSplitter';
import { checkDatasetLimit } from '@fastgpt/service/support/permission/teamLimit';
import { predictDataLimitLength } from '@fastgpt/global/core/dataset/utils';
import { pushDataListToTrainingQueue } from '@fastgpt/service/core/dataset/training/controller';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { createTrainingUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { getLLMModel, getVectorModel } from '@fastgpt/service/core/ai/model';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const {
      name,
      text,
      trainingType = TrainingModeEnum.chunk,
      chunkSize = 512,
      chunkSplitter,
      qaPrompt,
      ...body
    } = req.body as TextCreateDatasetCollectionParams;

    const { teamId, tmbId, dataset } = await authDataset({
      req,
      authToken: true,
      authApiKey: true,
      datasetId: body.datasetId,
      per: 'w'
    });

    // 1. split text to chunks
    const { chunks } = splitText2Chunks({
      text,
      chunkLen: chunkSize,
      overlapRatio: trainingType === TrainingModeEnum.chunk ? 0.2 : 0,
      customReg: chunkSplitter ? [chunkSplitter] : []
    });

    // 2. check dataset limit
    await checkDatasetLimit({
      teamId,
      insertLen: predictDataLimitLength(trainingType, chunks)
    });

    const createResult = await mongoSessionRun(async (session) => {
      // 3. create collection
      const { _id: collectionId } = await createOneCollection({
        ...body,
        teamId,
        tmbId,
        type: DatasetCollectionTypeEnum.virtual,

        name,
        trainingType,
        chunkSize,
        chunkSplitter,
        qaPrompt,

        hashRawText: hashStr(text),
        rawTextLength: text.length,
        session
      });

      // 4. create training bill
      const { billId } = await createTrainingUsage({
        teamId,
        tmbId,
        appName: name,
        billSource: UsageSourceEnum.training,
        vectorModel: getVectorModel(dataset.vectorModel)?.name,
        agentModel: getLLMModel(dataset.agentModel)?.name,
        session
      });

      // 5. push chunks to training queue
      const insertResults = await pushDataListToTrainingQueue({
        teamId,
        tmbId,
        datasetId: dataset._id,
        collectionId,
        agentModel: dataset.agentModel,
        vectorModel: dataset.vectorModel,
        trainingMode: trainingType,
        prompt: qaPrompt,
        billId,
        data: chunks.map((text, index) => ({
          q: text,
          chunkIndex: index
        })),
        session
      });

      return { collectionId, results: insertResults };
    });

    jsonRes(res, {
      data: createResult
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
