import type { FastGPTFeConfigsType } from '@fastgpt/global/common/system/types/index.d';
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { readFileSync, readdirSync } from 'fs';
import type { InitDateResponse } from '@/global/common/api/systemRes';
import type { FastGPTConfigFileType } from '@fastgpt/global/common/system/types/index.d';
import { PluginSourceEnum } from '@fastgpt/global/core/plugin/constants';
import { getFastGPTConfigFromDB } from '@fastgpt/service/common/system/config/controller';
import { connectToDatabase } from '@/service/mongo';
import { PluginTemplateType } from '@fastgpt/global/core/plugin/type';
import { readConfigData } from '@/service/common/system';
import { exit } from 'process';
import { FastGPTProUrl } from '@fastgpt/service/common/system/constants';
import { initFastGPTConfig } from '@fastgpt/service/common/system/tools';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await getInitConfig();

  jsonRes<InitDateResponse>(res, {
    data: {
      feConfigs: global.feConfigs,
      subPlans: global.subPlans,
      llmModels: global.llmModels,
      vectorModels: global.vectorModels,
      reRankModels:
        global.reRankModels?.map((item) => ({
          ...item,
          requestUrl: undefined,
          requestAuth: undefined
        })) || [],
      whisperModel: global.whisperModel,
      audioSpeechModels: global.audioSpeechModels,
      systemVersion: global.systemVersion || '0.0.0',
      simpleModeTemplates: global.simpleModeTemplates
    }
  });
}

const defaultFeConfigs: FastGPTFeConfigsType = {
  show_emptyChat: true,
  show_git: true,
  docUrl: '',//https://doc.fastgpt.in
  openAPIDocUrl: '',//https://doc.fastgpt.in/docs/development/openapi
  systemTitle: 'WXBAI',
  concatMd:
    '',
  limit: {
    exportDatasetLimitMinutes: 0,
    websiteSyncLimitMinuted: 0
  },
  scripts: [],
  favicon: '/favicon.ico',
  uploadFileMaxSize: 500
};

export async function getInitConfig() {
  if (global.systemInitd) return;
  global.systemInitd = true;

  try {
    await connectToDatabase();

    await Promise.all([
      initSystemConfig(),
      // getSimpleModeTemplates(),
      getSystemVersion(),
      getSystemPlugin()
    ]);

    console.log({
      // simpleModeTemplates: global.simpleModeTemplates,
      communityPlugins: global.communityPlugins
    });
  } catch (error) {
    console.error('Load init config error', error);
    global.systemInitd = false;

    if (!global.feConfigs) {
      exit(1);
    }
  }
}

export async function initSystemConfig() {
  // load config
  const [dbConfig, fileConfig] = await Promise.all([
    getFastGPTConfigFromDB(),
    readConfigData('config.json')
  ]);
  const fileRes = JSON.parse(fileConfig) as FastGPTConfigFileType;

  // get config from database
  const config: FastGPTConfigFileType = {
    feConfigs: {
      ...defaultFeConfigs,
      ...(dbConfig.feConfigs || {}),
      isPlus: !!FastGPTProUrl
    },
    systemEnv: {
      ...fileRes.systemEnv,
      ...(dbConfig.systemEnv || {})
    },
    subPlans: dbConfig.subPlans || fileRes.subPlans,
    llmModels: dbConfig.llmModels || fileRes.llmModels || [],
    vectorModels: dbConfig.vectorModels || fileRes.vectorModels || [],
    reRankModels: dbConfig.reRankModels || fileRes.reRankModels || [],
    audioSpeechModels: dbConfig.audioSpeechModels || fileRes.audioSpeechModels || [],
    whisperModel: dbConfig.whisperModel || fileRes.whisperModel
  };

  // set config
  initFastGPTConfig(config);

  console.log({
    feConfigs: global.feConfigs,
    systemEnv: global.systemEnv,
    subPlans: global.subPlans,
    llmModels: global.llmModels,
    vectorModels: global.vectorModels,
    reRankModels: global.reRankModels,
    audioSpeechModels: global.audioSpeechModels,
    whisperModel: global.whisperModel
  });
}

export function getSystemVersion() {
  if (global.systemVersion) return;
  try {
    if (process.env.NODE_ENV === 'development') {
      global.systemVersion = process.env.npm_package_version || '0.0.0';
    } else {
      const packageJson = JSON.parse(readFileSync('/app/package.json', 'utf-8'));

      global.systemVersion = packageJson?.version;
    }
    console.log(`System Version: ${global.systemVersion}`);
  } catch (error) {
    console.log(error);

    global.systemVersion = '0.0.0';
  }
}

// async function getSimpleModeTemplates() {
//   if (global.simpleModeTemplates && global.simpleModeTemplates.length > 0) return;

//   try {
//     const basePath =
//       process.env.NODE_ENV === 'development' ? 'data/simpleTemplates' : '/app/data/simpleTemplates';
//     // read data/simpleTemplates directory, get all json file
//     const files = readdirSync(basePath);
//     // filter json file
//     const filterFiles = files.filter((item) => item.endsWith('.json'));

//     // read json file
//     const fileTemplates = filterFiles.map((item) => {
//       const content = readFileSync(`${basePath}/${item}`, 'utf-8');
//       return {
//         id: item.replace('.json', ''),
//         ...JSON.parse(content)
//       };
//     });

//     // fetch templates from plus
//     const plusTemplates = await getSimpleTemplatesFromPlus();

//     global.simpleModeTemplates = [
//       SimpleModeTemplate_FastGPT_Universal,
//       ...plusTemplates,
//       ...fileTemplates
//     ];
//   } catch (error) {
//     global.simpleModeTemplates = [SimpleModeTemplate_FastGPT_Universal];
//   }
// }

function getSystemPlugin() {
  if (global.communityPlugins && global.communityPlugins.length > 0) return;

  const basePath =
    process.env.NODE_ENV === 'development' ? 'data/pluginTemplates' : '/app/data/pluginTemplates';
  // read data/pluginTemplates directory, get all json file
  const files = readdirSync(basePath);
  // filter json file
  const filterFiles = files.filter((item) => item.endsWith('.json'));

  // read json file
  const fileTemplates: PluginTemplateType[] = filterFiles.map((filename) => {
    const content = readFileSync(`${basePath}/${filename}`, 'utf-8');
    return {
      ...JSON.parse(content),
      id: `${PluginSourceEnum.community}-${filename.replace('.json', '')}`,
      source: PluginSourceEnum.community
    };
  });

  global.communityPlugins = fileTemplates;
}
