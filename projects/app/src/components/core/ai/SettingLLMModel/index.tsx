import React, { useEffect } from 'react';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { LLMModelTypeEnum, llmModelTypeFilterMap } from '@fastgpt/global/core/ai/constants';
import { Box, Button, useDisclosure } from '@chakra-ui/react';
import { SettingAIDataType } from '@fastgpt/global/core/module/node/type';
import AISettingModal from '@/components/core/ai/AISettingModal';
import Avatar from '@/components/Avatar';
import { HUGGING_FACE_ICON } from '@fastgpt/global/common/system/constants';

type Props = {
  llmModelType?: `${LLMModelTypeEnum}`;
  defaultData: SettingAIDataType;
  onChange: (e: SettingAIDataType) => void;
};

const SettingLLMModel = ({ llmModelType = LLMModelTypeEnum.all, defaultData, onChange }: Props) => {
  const { llmModelList } = useSystemStore();

  const model = defaultData.model;

  const modelList = llmModelList.filter((model) => {
    if (!llmModelType) return true;
    const filterField = llmModelTypeFilterMap[llmModelType];
    if (!filterField) return true;
    //@ts-ignore
    return !!model[filterField];
  });

  const selectedModel = modelList.find((item) => item.model === model) || modelList[0];

  const {
    isOpen: isOpenAIChatSetting,
    onOpen: onOpenAIChatSetting,
    onClose: onCloseAIChatSetting
  } = useDisclosure();

  useEffect(() => {
    if (!model && modelList.length > 0) {
      onChange({
        ...defaultData,
        model: modelList[0].model
      });
    }
  }, [defaultData, model, modelList, onChange]);

  return (
    <Box position={'relative'}>
      <Button
        w={'100%'}
        justifyContent={'flex-start'}
        variant={'whitePrimary'}
        _active={{
          transform: 'none'
        }}
        leftIcon={
          <Avatar
            borderRadius={'0'}
            src={selectedModel?.avatar || HUGGING_FACE_ICON}
            fallbackSrc={HUGGING_FACE_ICON}
            w={'18px'}
          />
        }
        pl={4}
        onClick={onOpenAIChatSetting}
      >
        {selectedModel?.name}
      </Button>
      {isOpenAIChatSetting && (
        <AISettingModal
          onClose={onCloseAIChatSetting}
          onSuccess={(e) => {
            onChange(e);
            onCloseAIChatSetting();
          }}
          defaultData={defaultData}
          llmModels={modelList}
        />
      )}
    </Box>
  );
};

export default React.memo(SettingLLMModel);
