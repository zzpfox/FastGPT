export enum FlowNodeInputTypeEnum {
  triggerAndFinish = 'triggerAndFinish',
  systemInput = 'systemInput', // history, userChatInput, variableInput

  input = 'input', // one line input
  numberInput = 'numberInput',
  select = 'select',
  slider = 'slider',
  target = 'target', // data input
  switch = 'switch',

  // editor
  textarea = 'textarea',
  JSONEditor = 'JSONEditor',

  addInputParam = 'addInputParam', // params input

  selectApp = 'selectApp',

  // chat special input
  aiSettings = 'aiSettings',

  // ai model select
  selectLLMModel = 'selectLLMModel',
  settingLLMModel = 'settingLLMModel',

  // dataset special input
  selectDataset = 'selectDataset',
  selectDatasetParamsModal = 'selectDatasetParamsModal',
  settingDatasetQuotePrompt = 'settingDatasetQuotePrompt',

  hidden = 'hidden',
  custom = 'custom'
}

export enum FlowNodeOutputTypeEnum {
  answer = 'answer',
  source = 'source',
  hidden = 'hidden',

  addOutputParam = 'addOutputParam'
}

export enum FlowNodeTypeEnum {
  userGuide = 'userGuide',
  questionInput = 'questionInput',
  historyNode = 'historyNode',
  chatNode = 'chatNode',

  datasetSearchNode = 'datasetSearchNode',
  datasetConcatNode = 'datasetConcatNode',

  answerNode = 'answerNode',
  classifyQuestion = 'classifyQuestion',
  contentExtract = 'contentExtract',
  httpRequest = 'httpRequest',
  httpRequest468 = 'httpRequest468',
  runApp = 'app',
  pluginModule = 'pluginModule',
  pluginInput = 'pluginInput',
  pluginOutput = 'pluginOutput',
  queryExtension = 'cfr',
  tools = 'tools',
  stopTool = 'stopTool',
  lafModule = 'lafModule'

  // abandon
}

export const EDGE_TYPE = 'default';
