import { browser } from 'webextension-polyfill-ts';

export const formatVersion = 1;

export const getPageContents = (): string => {
    return document.body.innerText;
};

export const getPageTitle = (): string => {
    return document.title;
};

export const formatDataForCodebuddy = (url: string, title: string, content: string): string => {
    const id = Math.floor(Math.random() * 1000000000).toString();
    return JSON.stringify(["codebuddyPageData", id, formatVersion, url, title, content]);
};

export const showNotification = (): void => {
    browser.notifications.create('codebuddy_' + Date.now(), {
        type: 'basic',
        iconUrl: 'assets/icons/favicon-48.png',
        title: 'Data extracted',
        message: 'Open your IDE to receive the data.',
    });
};
