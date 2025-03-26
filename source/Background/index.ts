import {browser} from 'webextension-polyfill-ts';
import {
  formatDataForCodebuddy,
  getPageContents,
  getPageTitle,
  showNotification,
} from './codebuddy-helper';

browser.runtime.onInstalled.addListener((): void => {
  browser.contextMenus.create({
    id: 'sendToCodebuddy',
    title: 'Send to Codebuddy',
    contexts: ['page'],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sendToCodebuddy' && tab?.id) {
    try {
      // Get page title
      const titleResult = await browser.tabs.executeScript(tab.id, {
        code: `(${getPageTitle.toString()})()`,
      });

      // Get page contents
      const contentResult = await browser.tabs.executeScript(tab.id, {
        code: `(${getPageContents.toString()})()`,
      });

      const title = titleResult[0] || '';
      const content = contentResult[0] || '';
      const data = formatDataForCodebuddy(tab.url || '', title, content);

      // Copy to clipboard
      await navigator.clipboard.writeText(data);
      showNotification();
    } catch (error) {
      console.error('Failed to extract page data:', error);
    }
  }
});
