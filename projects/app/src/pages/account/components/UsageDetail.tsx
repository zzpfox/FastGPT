import React, { useMemo } from 'react';
import {
  ModalBody,
  Flex,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { UsageItemType } from '@fastgpt/global/support/wallet/usage/type.d';
import dayjs from 'dayjs';
import { UsageSourceMap } from '@fastgpt/global/support/wallet/usage/constants';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'next-i18next';
import { formatNumber } from '@fastgpt/global/common/math/tools';

const UsageDetail = ({ usage, onClose }: { usage: UsageItemType; onClose: () => void }) => {
  const { t } = useTranslation();
  const filterBillList = useMemo(
    () => usage.list.filter((item) => item && item.moduleName),
    [usage.list]
  );

  const { hasModel, hasToken, hasCharsLen, hasDuration } = useMemo(() => {
    let hasModel = false;
    let hasToken = false;
    let hasCharsLen = false;
    let hasDuration = false;
    let hasDataLen = false;

    usage.list.forEach((item) => {
      if (item.model !== undefined) {
        hasModel = true;
      }

      if (typeof item.tokens === 'number') {
        hasToken = true;
      }
      if (typeof item.charsLength === 'number') {
        hasCharsLen = true;
      }
      if (typeof item.duration === 'number') {
        hasDuration = true;
      }
    });

    return {
      hasModel,
      hasToken,
      hasCharsLen,
      hasDuration,
      hasDataLen
    };
  }, [usage.list]);

  return (
    <MyModal
      isOpen={true}
      onClose={onClose}
      iconSrc="/imgs/modal/bill.svg"
      title={t('support.wallet.usage.Usage Detail')}
      maxW={['90vw', '700px']}
    >
      <ModalBody>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 80px'}>{t('support.wallet.bill.Number')}:</Box>
          <Box>{usage.id}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 80px'}>{t('support.wallet.usage.Time')}:</Box>
          <Box>{dayjs(usage.time).format('YYYY/MM/DD HH:mm:ss')}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 80px'}>{t('support.wallet.usage.App name')}:</Box>
          <Box>{t(usage.appName) || '-'}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 80px'}>{t('support.wallet.usage.Source')}:</Box>
          <Box>{t(UsageSourceMap[usage.source]?.label)}</Box>
        </Flex>
        <Flex alignItems={'center'} pb={4}>
          <Box flex={'0 0 80px'}>{t('support.wallet.usage.Total points')}:</Box>
          <Box fontWeight={'bold'}>{formatNumber(usage.totalPoints)}</Box>
        </Flex>
        <Box pb={4}>
          <Box flex={'0 0 80px'} mb={1}>
            {t('support.wallet.usage.Bill Module')}
          </Box>
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>{t('support.wallet.usage.Module name')}</Th>
                  {hasModel && <Th>{t('support.wallet.usage.Ai model')}</Th>}
                  {hasToken && <Th>{t('support.wallet.usage.Token Length')}</Th>}
                  {hasCharsLen && <Th>{t('support.wallet.usage.Text Length')}</Th>}
                  {hasDuration && <Th>{t('support.wallet.usage.Duration')}</Th>}
                  <Th>{t('support.wallet.usage.Total points')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filterBillList.map((item, i) => (
                  <Tr key={i}>
                    <Td>{t(item.moduleName)}</Td>
                    {hasModel && <Td>{item.model ?? '-'}</Td>}
                    {hasToken && <Td>{item.tokens ?? '-'}</Td>}
                    {hasCharsLen && <Td>{item.charsLength ?? '-'}</Td>}
                    {hasDuration && <Td>{item.duration ?? '-'}</Td>}
                    <Td>{formatNumber(item.amount)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </ModalBody>
    </MyModal>
  );
};

export default UsageDetail;
