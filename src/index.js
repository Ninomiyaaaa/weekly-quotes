import Koa from 'koa';
import Router from 'koa-router';
import { koaBody } from 'koa-body';
import cron from 'node-cron';
import rateLimit from 'koa-ratelimit';
import { fetchWeeklyQuotes, fetchAndPushWithoutSaving } from './services/fetcher.js';
import { setupLogger } from './utils/logger.js';
import { DataStore } from './services/dataStore.js';

const app = new Koa();
const router = new Router();
const logger = setupLogger();
const dataStore = new DataStore();

// 速率限制配置
const rateLimiter = rateLimit({
  driver: 'memory',
  db: new Map(),
  duration: 60000, // 1分钟
  max: 30, // 每个IP每分钟最多30次请求
  errorMessage: '请求过于频繁，请稍后再试',
  id: (ctx) => ctx.ip,
});

// 应用速率限制中间件
app.use(rateLimiter);

// Middleware
app.use(koaBody());

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message
    };
    logger.error(`Error handling request: ${err.message}`);
  }
});

// Routes
router.get('/current-issue', async (ctx) => {
  ctx.body = {
    currentIssue: dataStore.getCurrentIssue()
  };
});

router.post('/trigger-fetch', async (ctx) => {
  try {
    const quotes = await fetchWeeklyQuotes(dataStore.getCurrentIssue());
    await dataStore.saveQuotes(quotes);
    ctx.body = {
      success: true,
      quotes
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error.message
    };
  }
});

// 新增：获取指定期数并推送，但不更新数据库
router.post('/fetch-and-push', async (ctx) => {
  try {
    const { issueNumber } = ctx.request.body;
    
    // 如果没有提供期数，使用当前期数
    const targetIssue = issueNumber || dataStore.getCurrentIssue();
    
    const result = await fetchAndPushWithoutSaving(targetIssue);
    
    ctx.body = {
      success: true,
      result
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error.message
    };
  }
});

router.get('/history', async (ctx) => {
  ctx.body = {
    history: dataStore.getHistory()
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Schedule weekly fetch (Every Monday at 9:00 AM)
cron.schedule('0 9 * * 1', async () => {
  logger.info('Starting scheduled fetch');
  try {
    const quotes = await fetchWeeklyQuotes(dataStore.getCurrentIssue());
    await dataStore.saveQuotes(quotes);
    logger.info(`Successfully fetched and saved quotes for issue ${dataStore.getCurrentIssue()}`);
  } catch (error) {
    logger.error(`Error in scheduled fetch: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});