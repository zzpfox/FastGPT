import React, { useCallback, useState } from 'react';
import {
  Box,
  Flex,
  Button,
  ModalFooter,
  ModalBody,
  Input,
  Grid,
  useTheme,
  Card,
  Text,
  HStack,
  Tag
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { useForm } from 'react-hook-form';
import { compressImgFileAndUpload } from '@/web/common/file/controller';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { postCreateApp } from '@/web/core/app/api';
import { useRouter } from 'next/router';
import { appTemplates } from '@/web/core/app/templates';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import Avatar from '@/components/Avatar';
import MyTooltip from '@/components/MyTooltip';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'next-i18next';
import { MongoImageTypeEnum } from '@fastgpt/global/common/file/image/constants';

type FormType = {
  avatar: string;
  name: string;
  templateId: string;
};

const CreateModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const { t } = useTranslation();
  const [refresh, setRefresh] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const theme = useTheme();
  const { isPc, feConfigs } = useSystemStore();
  const { register, setValue, getValues, handleSubmit } = useForm<FormType>({
    defaultValues: {
      avatar: '/icon/logo.svg',
      name: '',
      templateId: appTemplates[0].id
    }
  });

  const { File, onOpen: onOpenSelectFile } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });

  const onSelectFile = useCallback(
    async (e: File[]) => {
      const file = e[0];
      if (!file) return;
      try {
        const src = await compressImgFileAndUpload({
          type: MongoImageTypeEnum.appAvatar,
          file,
          maxW: 300,
          maxH: 300
        });
        setValue('avatar', src);
        setRefresh((state) => !state);
      } catch (err: any) {
        toast({
          title: getErrText(err, t('common.error.Select avatar failed')),
          status: 'warning'
        });
      }
    },
    [setValue, t, toast]
  );

  const { mutate: onclickCreate, isLoading: creating } = useRequest({
    mutationFn: async (data: FormType) => {
      const template = appTemplates.find((item) => item.id === data.templateId);
      if (!template) {
        return Promise.reject(t('core.dataset.error.Template does not exist'));
      }
      return postCreateApp({
        avatar: data.avatar,
        name: data.name,
        type: template.type,
        modules: template.modules || []
      });
    },
    onSuccess(id: string) {
      router.push(`/app/detail?appId=${id}`);
      onSuccess();
      onClose();
    },
    successToast: t('common.Create Success'),
    errorToast: t('common.Create Failed')
  });

  return (
    <MyModal
      iconSrc="/imgs/module/ai.svg"
      title={t('core.app.create app')}
      isOpen
      onClose={onClose}
      isCentered={!isPc}
    >
      <ModalBody>
        <Box color={'myGray.800'} fontWeight={'bold'}>
          {t('common.Set Name')}
        </Box>
        <Flex mt={3} alignItems={'center'}>
          <MyTooltip label={t('common.Set Avatar')}>
            <Avatar
              flexShrink={0}
              src={getValues('avatar')}
              w={['28px', '32px']}
              h={['28px', '32px']}
              cursor={'pointer'}
              borderRadius={'md'}
              onClick={onOpenSelectFile}
            />
          </MyTooltip>
          <Input
            flex={1}
            ml={4}
            autoFocus
            bg={'myWhite.600'}
            {...register('name', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        {!feConfigs?.hide_app_flow && (
          <>
            <Box mt={[4, 7]} mb={[0, 3]} color={'myGray.800'} fontWeight={'bold'}>
              {t('core.app.Select app from template')}
            </Box>
            <Grid
              userSelect={'none'}
              gridTemplateColumns={['repeat(1,1fr)', 'repeat(2,1fr)']}
              gridGap={[2, 4]}
            >
              {appTemplates.map((item) => (
                <Card
                  key={item.id}
                  border={theme.borders.base}
                  p={3}
                  borderRadius={'md'}
                  cursor={'pointer'}
                  boxShadow={'sm'}
                  {...(getValues('templateId') === item.id
                    ? {
                        bg: 'myWhite.600'
                      }
                    : {
                        _hover: {
                          boxShadow: 'md'
                        }
                      })}
                  onClick={() => {
                    setValue('templateId', item.id);
                    setRefresh((state) => !state);
                  }}
                >
                  <Flex alignItems={'center'}>
                    <Avatar src={item.avatar} borderRadius={'md'} w={'20px'} />
                    <Box ml={3} fontWeight={'bold'}>
                      {t(item.name)}
                    </Box>
                  </Flex>
                  <Box fontSize={'sm'} mt={4}>
                    {t(item.intro)}
                  </Box>
                </Card>
              ))}
            </Grid>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant={'whiteBase'} mr={3} onClick={onClose}>
          {t('common.Close')}
        </Button>
        <Button isLoading={creating} onClick={handleSubmit((data) => onclickCreate(data))}>
          {t('common.Confirm Create')}
        </Button>
      </ModalFooter>

      <File onSelect={onSelectFile} />
    </MyModal>
  );
};

export default CreateModal;
