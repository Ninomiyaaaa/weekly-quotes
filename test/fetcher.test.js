import fetchMock from 'jest-fetch-mock';
import { fetchWeeklyQuotes } from '../src/services/fetcher.js';

// 启用jest-fetch-mock
fetchMock.enableMocks();

describe('fetcher服务测试', () => {
  // 在每个测试前重置所有mock
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('应该正确获取并提取言论', async () => {
    // 模拟GitHub原始文件内容响应
    const mockResponse = `
# 科技爱好者周刊（第 342 期）

这里记录每周值得分享的科技内容，周五发布。

## 言论

> 1. 最好的程序员不是写最多代码的人，而是思考如何用最少的代码解决问题的人。

> 2. 创业公司不要过早招聘 HR，因为 HR 的人际关系和政治敏感度很高，会过早地将公司变成一个政治组织，而不是一个产品组织。

> 3. 现在的年轻人不太愿意做艰苦的工作，比如工厂的夜班，因为他们从小养尊处优，不习惯吃苦。这导致很多蓝领工作缺少年轻人接班。
    `;

    // 模拟webhook调用的响应
    const mockWebhookResponse = { errcode: 0, errmsg: 'ok' };

    // 配置fetch mock的行为
    fetchMock.mockResponses(
      [mockResponse, { status: 200 }],
      [JSON.stringify(mockWebhookResponse), { status: 200 }]
    );

    // 调用测试函数
    const result = await fetchWeeklyQuotes(342);

    // 验证结果
    expect(result).toHaveProperty('issueNumber', 342);
    expect(result).toHaveProperty('quotes');
    expect(result.quotes).toHaveLength(3);
    expect(result.quotes[0]).toEqual('最好的程序员不是写最多代码的人，而是思考如何用最少的代码解决问题的人。');
    
    // 验证fetch被正确调用
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('https://raw.githubusercontent.com/ruanyf/weekly/master/docs/issue-342.md');
    expect(fetchMock).toHaveBeenCalledWith('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=dcecab8e-fe2c-49c9-94b7-3bde7b990279', expect.any(Object));
  });

  test('应该处理GitHub获取失败的情况', async () => {
    // 模拟GitHub请求失败
    fetchMock.mockResponseOnce('', { status: 404, statusText: 'Not Found' });

    // 验证抛出异常
    await expect(fetchWeeklyQuotes(999)).rejects.toThrow('Failed to fetch issue 999: Not Found');
  });
}); 