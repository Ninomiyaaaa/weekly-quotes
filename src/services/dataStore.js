import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

export class DataStore {
  constructor() {
    this.dataFile = 'data/store.json';
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
      }

      if (!fs.existsSync(this.dataFile)) {
        const initialData = {
          currentIssue: 342,
          history: []
        };
        fs.writeFileSync(this.dataFile, JSON.stringify(initialData, null, 2));
        return initialData;
      }

      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      return data;
    } catch (error) {
      logger.error(`Error loading data: ${error.message}`);
      return {
        currentIssue: 342,
        history: []
      };
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
    } catch (error) {
      logger.error(`Error saving data: ${error.message}`);
    }
  }

  getCurrentIssue() {
    return this.data.currentIssue;
  }

  getHistory() {
    return this.data.history;
  }

  async saveQuotes(quotes) {
    this.data.history.push(quotes);
    this.data.currentIssue++;
    this.saveData();
    return quotes;
  }
}