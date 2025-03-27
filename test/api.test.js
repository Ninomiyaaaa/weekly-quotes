import { jest } from '@jest/globals';
import fetch from 'node-fetch';
import { fetchAndPushWithoutSaving } from '../src/services/fetcher.js';

// 模拟node-fetch
jest.mock('node-fetch');

describe('API功能测试', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('fetchAndPushWithoutSaving应该获取并推送但不影响数据库', async () => {
    // 模拟GitHub原始文件内容响应
    const mockResponse = `
# 科技爱好者周刊（第 350 期）

这里记录每周值得分享的科技内容，周五发布。

## 言论

> 1. 这是测试言论1。

> 2. 这是测试言论2。
    `;

    // 模拟webhook调用的响应
    const mockWebhookResponse = { errcode: 0, errmsg: 'ok' };

    // 配置fetch mock的行为
    fetch.mockImplementation((url) => {
      if (url.includes('github')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockResponse)
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWebhookResponse)
        });
      }
    });

    // 调用测试函数
    const result = await fetchAndPushWithoutSaving(350);

    // 验证结果
    expect(result).toHaveProperty('issueNumber', 350);
    expect(result).toHaveProperty('quotes');
    expect(result).toHaveProperty('saved', false);
    expect(result.quotes).toHaveLength(2);
    expect(result.quotes[0]).toEqual('这是测试言论1。');
    
    // 验证fetch被正确调用
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/ruanyf/weekly/master/docs/issue-350.md');
    expect(fetch).toHaveBeenCalledWith('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=dcecab8e-fe2c-49c9-94b7-3bde7b990279', expect.any(Object));
  });
}); 