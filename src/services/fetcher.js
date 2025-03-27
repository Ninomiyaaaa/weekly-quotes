import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const MAX_RETRIES = 3;  // 最大重试次数
const INITIAL_RETRY_DELAY = 1000;  // 初始重试延迟（毫秒）

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 带重试的fetch函数
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES, retryDelay = INITIAL_RETRY_DELAY) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    logger.warn(`请求失败，${retries}次重试机会剩余，将在${retryDelay/1000}秒后重试...`);
    await delay(retryDelay);
    
    // 指数退避，每次重试延迟时间翻倍
    return fetchWithRetry(url, options, retries - 1, retryDelay * 2);
  }
}

async function pushToWebhook(text, issueNumber) {
  const content = `## 科技爱好者周刊第 ${issueNumber} 期言论\n\n${text}`;
  
  const response = await fetchWithRetry(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msgtype: 'markdown',
      markdown: {
        content,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to push to webhook: ${response.statusText}`);
  }

  return await response.json();
}

export async function fetchWeeklyQuotes(issueNumber) {
	const fileName = `issue-${issueNumber}.md`
  const url = `https://raw.githubusercontent.com/ruanyf/weekly/master/docs/${fileName}`;
  
  try {
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch issue ${issueNumber}: ${response.statusText}`);
    }

    const content = await response.text();
    const text = extractContent(content, fileName);
    
    // Push to webhook
    await pushToWebhook(text, issueNumber);
    logger.info(`Successfully pushed quotes from issue ${issueNumber} to webhook`);
    
    return {
      issueNumber,
      text,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error fetching issue ${issueNumber}: ${error.message}`);
    throw error;
  }
}

/**
 * 获取并推送指定期数的内容，但不更新数据库中的期数
 * @param {number} issueNumber - 要获取的期数
 * @returns {Promise<Object>} - 包含获取结果的对象
 */
export async function fetchAndPushWithoutSaving(issueNumber) {
	const fileName = `issue-${issueNumber}.md`
  const url = `https://raw.githubusercontent.com/ruanyf/weekly/master/docs/${fileName}`;
  
  try {
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch issue ${issueNumber}: ${response.statusText}`);
    }

    const content = await response.text();
    const text = extractContent(content, fileName);
    
    // Push to webhook
    await pushToWebhook(text, issueNumber);
    logger.info(`Successfully pushed quotes from issue ${issueNumber} to webhook (without saving)`);
    
    return {
      issueNumber,
      text,
      fetchedAt: new Date().toISOString(),
      saved: false
    };
  } catch (error) {
    logger.error(`Error fetching issue ${issueNumber}: ${error.message}`);
    throw error;
  }
}

function extractContent(content, fileName) {
	if (!content) return
	let result = ''
	
	const patternSpeech = /## 言论\n([\s\S]*?)##/;
	const speechMatch = content.match(patternSpeech);
	if (speechMatch && speechMatch[0]) {
		let speech = speechMatch[0]
		if (speech.endsWith('##')) {
			speech = speech.substring(0, speech.length - 2)
			// 去掉"## 言论\n"
			speech = speech.replace(/^## 言论\n\n/, '')
			// 去掉序号后的换行符
			speech = speech.replace(/(\d+、)\n\n/g, '$1 ')
			result = speech
		}
		console.log('result', result)
	} else {
		result = ''
		console.error('未找到【言论】部分')
	}

	result += '\n'
	let title = ''
	const patternTitle = /^# .*\n/;
	const titleMatch = content.match(patternTitle);
	if (titleMatch && titleMatch[0]) {
		title = titleMatch[0]
		title = title.substring(2, title.length - 1)
		const pageUrl = 'https://github.com/ruanyf/weekly/blob/master/docs/' + fileName;
		title = `## 摘录自 [${title}](${pageUrl})`
	}

	result += title
	return result
}