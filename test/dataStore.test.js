import { jest } from '@jest/globals';
import fs from 'fs';
import { DataStore } from '../src/services/dataStore.js';

// 模拟fs模块
jest.mock('fs');

describe('DataStore服务测试', () => {
  // 模拟数据
  const mockData = {
    currentIssue: 342,
    history: []
  };

  beforeEach(() => {
    // 重置所有模拟
    jest.resetAllMocks();
    
    // 模拟文件系统方法
    fs.existsSync = jest.fn()
      .mockReturnValueOnce(true)  // 目录存在
      .mockReturnValueOnce(true); // 文件存在
    
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockData));
    fs.writeFileSync = jest.fn();
  });

  test('应该正确加载数据', () => {
    const dataStore = new DataStore();
    
    expect(dataStore.getCurrentIssue()).toBe(342);
    expect(dataStore.getHistory()).toEqual([]);
    expect(fs.readFileSync).toHaveBeenCalled();
  });

  test('应该保存引用并增加期数', async () => {
    const dataStore = new DataStore();
    const quotes = {
      issueNumber: 342,
      quotes: ['这是一条测试言论'],
      fetchedAt: new Date().toISOString()
    };

    await dataStore.saveQuotes(quotes);
    
    expect(dataStore.getCurrentIssue()).toBe(343);
    expect(dataStore.getHistory()).toContain(quotes);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('当目录或文件不存在时应创建初始数据', () => {
    // 重置模拟
    jest.resetAllMocks();
    
    // 模拟目录和文件不存在
    fs.existsSync = jest.fn()
      .mockReturnValueOnce(false)  // 目录不存在
      .mockReturnValueOnce(false); // 文件不存在
    
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();
    
    const dataStore = new DataStore();
    
    // 验证创建了目录和文件
    expect(fs.mkdirSync).toHaveBeenCalledWith('data');
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(dataStore.getCurrentIssue()).toBe(342);
  });
}); 