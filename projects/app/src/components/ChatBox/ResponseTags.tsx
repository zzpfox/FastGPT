import React, { useMemo, useState } from 'react';
import { type ChatHistoryItemResType } from '@fastgpt/global/core/chat/type.d';
import { DispatchNodeResponseType } from '@fastgpt/global/core/module/runtime/type.d';
import type { ChatItemType } from '@fastgpt/global/core/chat/type';
import { Flex, BoxProps, useDisclosure, useTheme, Box } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import type { SearchDataResponseItemType } from '@fastgpt/global/core/dataset/type';
import dynamic from 'next/dynamic';
import Tag from '../Tag';
import MyTooltip from '../MyTooltip';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/module/node/constant';
import { getSourceNameIcon } from '@fastgpt/global/core/dataset/utils';
import ChatBoxDivider from '@/components/core/chat/Divider';
import { strIsLink } from '@fastgpt/global/common/string/tools';
import MyIcon from '@fastgpt/web/components/common/Icon';

const QuoteModal = dynamic(() => import('./QuoteModal'));
const ContextModal = dynamic(() => import('./ContextModal'));
const WholeResponseModal = dynamic(() => import('./WholeResponseModal'));

const isLLMNode = (item: ChatHistoryItemResType) =>
  item.moduleType === FlowNodeTypeEnum.chatNode || item.moduleType === FlowNodeTypeEnum.tools;

const ResponseTags = ({
  flowResponses = [],
  showDetail
}: {
  flowResponses?: ChatHistoryItemResType[];
  showDetail: boolean;
}) => {
  const theme = useTheme();
  const { isPc } = useSystemStore();
  const { t } = useTranslation();
  const [quoteModalData, setQuoteModalData] = useState<{
    rawSearch: SearchDataResponseItemType[];
    metadata?: {
      collectionId: string;
      sourceId?: string;
      sourceName: string;
    };
  }>();
  const [contextModalData, setContextModalData] =
    useState<DispatchNodeResponseType['historyPreview']>();
  const {
    isOpen: isOpenWholeModal,
    onOpen: onOpenWholeModal,
    onClose: onCloseWholeModal
  } = useDisclosure();

  const {
    llmModuleAccount,
    quoteList = [],
    sourceList = [],
    historyPreview = [],
    runningTime = 0
  } = useMemo(() => {
    const flatResponse = flowResponses
      .map((item) => {
        if (item.pluginDetail || item.toolDetail) {
          return [item, ...(item.pluginDetail || []), ...(item.toolDetail || [])];
        }
        return item;
      })
      .flat();

    const chatData = flatResponse.find(isLLMNode);

    const quoteList = flatResponse
      .filter((item) => item.moduleType === FlowNodeTypeEnum.datasetSearchNode)
      .map((item) => item.quoteList)
      .flat()
      .filter(Boolean) as SearchDataResponseItemType[];

    const sourceList = quoteList.reduce(
      (acc: Record<string, SearchDataResponseItemType[]>, cur) => {
        if (!acc[cur.collectionId]) {
          acc[cur.collectionId] = [cur];
        }
        return acc;
      },
      {}
    );

    return {
      llmModuleAccount: flatResponse.filter(isLLMNode).length,
      quoteList,
      sourceList: Object.values(sourceList)
        .flat()
        .map((item) => ({
          sourceName: item.sourceName,
          sourceId: item.sourceId,
          icon: getSourceNameIcon({ sourceId: item.sourceId, sourceName: item.sourceName }),
          canReadQuote: showDetail || strIsLink(item.sourceId),
          collectionId: item.collectionId
        })),
      historyPreview: chatData?.historyPreview,
      runningTime: +flowResponses.reduce((sum, item) => sum + (item.runningTime || 0), 0).toFixed(2)
    };
  }, [showDetail, flowResponses]);

  const TagStyles: BoxProps = {
    mr: 2,
    bg: 'transparent'
  };

  return flowResponses.length === 0 ? null : (
    <>
      {sourceList.length > 0 && (
        <>
          <ChatBoxDivider icon="core/chat/quoteFill" text={t('core.chat.Quote')} />
          <Flex alignItems={'center'} flexWrap={'wrap'} gap={2}>
            {sourceList.map((item) => (
              <MyTooltip key={item.collectionId} label={t('core.chat.quote.Read Quote')}>
                <Flex
                  alignItems={'center'}
                  fontSize={'sm'}
                  border={theme.borders.sm}
                  py={1}
                  px={2}
                  borderRadius={'sm'}
                  _hover={{
                    '.controller': {
                      display: 'flex'
                    }
                  }}
                  overflow={'hidden'}
                  position={'relative'}
                  cursor={'pointer'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuoteModalData({
                      rawSearch: quoteList,
                      metadata: {
                        collectionId: item.collectionId,
                        sourceId: item.sourceId,
                        sourceName: item.sourceName
                      }
                    });
                  }}
                >
                  <MyIcon name={item.icon as any} mr={1} flexShrink={0} w={'12px'} />
                  <Box className="textEllipsis3" wordBreak={'break-all'} flex={'1 0 0'}>
                    {item.sourceName}
                  </Box>
                </Flex>
              </MyTooltip>
            ))}
          </Flex>
        </>
      )}
      {showDetail && (
        <Flex alignItems={'center'} mt={3} flexWrap={'wrap'}>
          {quoteList.length > 0 && (
            <MyTooltip label="查看引用">
              <Tag
                colorSchema="blue"
                cursor={'pointer'}
                {...TagStyles}
                onClick={() => setQuoteModalData({ rawSearch: quoteList })}
              >
                {quoteList.length}条引用
              </Tag>
            </MyTooltip>
          )}
          {llmModuleAccount === 1 && (
            <>
              {historyPreview.length > 0 && (
                <MyTooltip label={'点击查看上下文预览'}>
                  <Tag
                    colorSchema="green"
                    cursor={'pointer'}
                    {...TagStyles}
                    onClick={() => setContextModalData(historyPreview)}
                  >
                    {historyPreview.length}条上下文
                  </Tag>
                </MyTooltip>
              )}
            </>
          )}
          {llmModuleAccount > 1 && (
            <Tag colorSchema="blue" {...TagStyles}>
              多组 AI 对话
            </Tag>
          )}

          {isPc && runningTime > 0 && (
            <MyTooltip label={'模块运行时间和'}>
              <Tag colorSchema="purple" cursor={'default'} {...TagStyles}>
                {runningTime}s
              </Tag>
            </MyTooltip>
          )}
          <MyTooltip label={t('core.chat.response.Read complete response tips')}>
            <Tag colorSchema="gray" cursor={'pointer'} {...TagStyles} onClick={onOpenWholeModal}>
              {t('core.chat.response.Read complete response')}
            </Tag>
          </MyTooltip>
        </Flex>
      )}
      {!!quoteModalData && (
        <QuoteModal
          {...quoteModalData}
          showDetail={showDetail}
          onClose={() => setQuoteModalData(undefined)}
        />
      )}
      {!!contextModalData && (
        <ContextModal context={contextModalData} onClose={() => setContextModalData(undefined)} />
      )}
      {isOpenWholeModal && (
        <WholeResponseModal
          response={flowResponses}
          showDetail={showDetail}
          onClose={onCloseWholeModal}
        />
      )}
    </>
  );
};

export default React.memo(ResponseTags);
