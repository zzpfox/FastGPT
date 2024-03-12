import type {
  ModuleDispatchProps,
  ModuleDispatchResponse
} from '@fastgpt/global/core/module/type.d';
import {
  DYNAMIC_INPUT_KEY,
  ModuleInputKeyEnum,
  ModuleOutputKeyEnum
} from '@fastgpt/global/core/module/constants';
import axios from 'axios';
import { valueTypeFormat } from '../utils';
import { SERVICE_LOCAL_HOST } from '@fastgpt/service/common/system/tools';
import { addLog } from '@fastgpt/service/common/system/log';

type PropsArrType = {
  key: string;
  type: string;
  value: string;
};
type HttpRequestProps = ModuleDispatchProps<{
  [ModuleInputKeyEnum.abandon_httpUrl]: string;
  [ModuleInputKeyEnum.httpMethod]: string;
  [ModuleInputKeyEnum.httpReqUrl]: string;
  [ModuleInputKeyEnum.httpHeaders]: PropsArrType[];
  [ModuleInputKeyEnum.httpParams]: PropsArrType[];
  [ModuleInputKeyEnum.httpJsonBody]: string;
  [DYNAMIC_INPUT_KEY]: Record<string, any>;
  [key: string]: any;
}>;
type HttpResponse = ModuleDispatchResponse<{
  [ModuleOutputKeyEnum.failed]?: boolean;
  [key: string]: any;
}>;

const UNDEFINED_SIGN = 'UNDEFINED_SIGN';

export const dispatchHttp468Request = async (props: HttpRequestProps): Promise<HttpResponse> => {
  let {
    appId,
    chatId,
    responseChatItemId,
    variables,
    module: { outputs },
    histories,
    params: {
      system_httpMethod: httpMethod = 'POST',
      system_httpReqUrl: httpReqUrl,
      system_httpHeader: httpHeader,
      system_httpParams: httpParams = [],
      system_httpJsonBody: httpJsonBody,
      [DYNAMIC_INPUT_KEY]: dynamicInput,
      ...body
    }
  } = props;

  if (!httpReqUrl) {
    return Promise.reject('Http url is empty');
  }

  const concatVariables = {
    appId,
    chatId,
    responseChatItemId,
    ...variables,
    histories: histories.slice(0, 10),
    ...body
  };

  // parse header
  const headers = await (() => {
    try {
      if (!httpHeader || httpHeader.length === 0) return {};
      // array
      return httpHeader.reduce((acc: Record<string, string>, item) => {
        const key = replaceVariable(item.key, concatVariables);
        const value = replaceVariable(item.value, concatVariables);
        acc[key] = valueTypeFormat(value, 'string');
        return acc;
      }, {});
    } catch (error) {
      return Promise.reject('Header 为非法 JSON 格式');
    }
  })();
  const params = httpParams.reduce((acc: Record<string, string>, item) => {
    const key = replaceVariable(item.key, concatVariables);
    const value = replaceVariable(item.value, concatVariables);
    acc[key] = valueTypeFormat(value, 'string');
    return acc;
  }, {});
  const requestBody = await (() => {
    if (!httpJsonBody) return { [DYNAMIC_INPUT_KEY]: dynamicInput };
    httpJsonBody = replaceVariable(httpJsonBody, concatVariables);
    try {
      const jsonParse = JSON.parse(httpJsonBody);
      const removeSignJson = removeUndefinedSign(jsonParse);
      return { [DYNAMIC_INPUT_KEY]: dynamicInput, ...removeSignJson };
    } catch (error) {
      console.log(error);
      return Promise.reject(`Invalid JSON body: ${httpJsonBody}`);
    }
  })();
  // console.log(params, requestBody, headers, concatVariables);

  try {
    const { formatResponse, rawResponse } = await fetchData({
      method: httpMethod,
      url: httpReqUrl,
      headers,
      body: requestBody,
      params
    });

    // format output value type
    const results: Record<string, any> = {};
    for (const key in formatResponse) {
      const output = outputs.find((item) => item.key === key);
      if (!output) continue;
      results[key] = valueTypeFormat(formatResponse[key], output.valueType);
    }

    return {
      [ModuleOutputKeyEnum.responseData]: {
        totalPoints: 0,
        params: Object.keys(params).length > 0 ? params : undefined,
        body: Object.keys(requestBody).length > 0 ? requestBody : undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        httpResult: rawResponse
      },
      ...results
    };
  } catch (error) {
    addLog.error('Http request error', error);
    return {
      [ModuleOutputKeyEnum.failed]: true,
      [ModuleOutputKeyEnum.responseData]: {
        totalPoints: 0,
        params: Object.keys(params).length > 0 ? params : undefined,
        body: Object.keys(requestBody).length > 0 ? requestBody : undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        httpResult: { error: formatHttpError(error) }
      }
    };
  }
};

async function fetchData({
  method,
  url,
  headers,
  body,
  params
}: {
  method: string;
  url: string;
  headers: Record<string, any>;
  body: Record<string, any>;
  params: Record<string, any>;
}): Promise<Record<string, any>> {
  const { data: response } = await axios<Record<string, any>>({
    method,
    baseURL: `http://${SERVICE_LOCAL_HOST}`,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    params: params,
    data: method === 'POST' ? body : {}
  });

  /*
    parse the json:
    {
      user: {
        name: 'xxx',
        age: 12
      },
      list: [
        {
          name: 'xxx',
          age: 50
        },
        [{ test: 22 }]
      ],
      psw: 'xxx'
    }

    result: {
      'user': { name: 'xxx', age: 12 },
      'user.name': 'xxx',
      'user.age': 12,
      'list': [ { name: 'xxx', age: 50 }, [ [Object] ] ],
      'list[0]': { name: 'xxx', age: 50 },
      'list[0].name': 'xxx',
      'list[0].age': 50,
      'list[1]': [ { test: 22 } ],
      'list[1][0]': { test: 22 },
      'list[1][0].test': 22,
      'psw': 'xxx'
    }
  */
  const parseJson = (obj: Record<string, any>, prefix = '') => {
    let result: Record<string, any> = {};

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        result[`${prefix}[${i}]`] = obj[i];

        if (Array.isArray(obj[i])) {
          result = {
            ...result,
            ...parseJson(obj[i], `${prefix}[${i}]`)
          };
        } else if (typeof obj[i] === 'object') {
          result = {
            ...result,
            ...parseJson(obj[i], `${prefix}[${i}].`)
          };
        }
      }
    } else if (typeof obj == 'object') {
      for (const key in obj) {
        result[`${prefix}${key}`] = obj[key];

        if (Array.isArray(obj[key])) {
          result = {
            ...result,
            ...parseJson(obj[key], `${prefix}${key}`)
          };
        } else if (typeof obj[key] === 'object') {
          result = {
            ...result,
            ...parseJson(obj[key], `${prefix}${key}.`)
          };
        }
      }
    }

    return result;
  };

  return {
    formatResponse: parseJson(response),
    rawResponse: response
  };
}

function replaceVariable(text: string, obj: Record<string, any>) {
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), UNDEFINED_SIGN);
    } else {
      const replacement = JSON.stringify(value);
      const unquotedReplacement =
        replacement.startsWith('"') && replacement.endsWith('"')
          ? replacement.slice(1, -1)
          : replacement;
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), unquotedReplacement);
    }
  }
  return text || '';
}
function removeUndefinedSign(obj: Record<string, any>) {
  for (const key in obj) {
    if (obj[key] === UNDEFINED_SIGN) {
      obj[key] = undefined;
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map((item: any) => {
        if (item === UNDEFINED_SIGN) {
          return undefined;
        } else if (typeof item === 'object') {
          removeUndefinedSign(item);
        }
        return item;
      });
    } else if (typeof obj[key] === 'object') {
      removeUndefinedSign(obj[key]);
    }
  }
  return obj;
}
function formatHttpError(error: any) {
  return {
    message: error?.message,
    name: error?.name,
    method: error?.config?.method,
    baseURL: error?.config?.baseURL,
    url: error?.config?.url,
    code: error?.code,
    status: error?.status
  };
}
