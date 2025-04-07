import { Quote } from '../models/Quote.js';
import { logger } from '../utils/logger.js';

export class DataStore {
  constructor() {
    this.currentIssue = 342; // 默认值
  }

  async initialize() {
    try {
      // 获取最新的期数
      const latestQuote = await Quote.findOne().sort({ issueNumber: -1 });
      if (latestQuote) {
        this.currentIssue = latestQuote.issueNumber;
      }
      logger.info(`Initialized with current issue: ${this.currentIssue}`);
    } catch (error) {
      logger.error(`Error initializing DataStore: ${error.message}`);
    }
  }

  getCurrentIssue() {
    return this.currentIssue;
  }

  incrementIssue() {
    this.currentIssue += 1;
    logger.info(`Incremented current issue to: ${this.currentIssue}`);
  }

  async getHistory() {
    try {
      return await Quote.find().sort({ issueNumber: -1 });
    } catch (error) {
      logger.error(`Error getting history: ${error.message}`);
      return [];
    }
  }

  async saveQuotes(quotes) {
    try {
      // 先增加期数
      this.incrementIssue();
      
      const quote = new Quote({
        issueNumber: this.currentIssue, // 使用增加后的期数
        text: quotes.text,
        fetchedAt: new Date(),
        pushedAt: new Date(),
        status: 'success'
      });

      await quote.save();
      logger.info(`Successfully saved quotes for issue ${this.currentIssue}`);
      return {
        ...quotes,
        issueNumber: this.currentIssue
      };
    } catch (error) {
      logger.error(`Error saving quotes: ${error.message}`);
      throw error;
    }
  }

  async saveFailedQuote(issueNumber, error) {
    try {
      const quote = new Quote({
        issueNumber,
        text: '',
        fetchedAt: new Date(),
        pushedAt: new Date(),
        status: 'failed',
        error: error.message
      });

      await quote.save();
      logger.error(`Saved failed quote for issue ${issueNumber}: ${error.message}`);
    } catch (error) {
      logger.error(`Error saving failed quote: ${error.message}`);
    }
  }
}