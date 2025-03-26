import * as chrome from "webextension-polyfill";

const getContents = () => {
    return document.body.innerText;
}

const getTitle = () => {
    return document.title;
}

const formatVersion = 1;

let offscreenDocReady = false;

// noinspection JSUnusedLocalSymbols
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'offscreen-doc-ready') {
        offscreenDocReady = true;
        console.log('Offscreen document is ready.');
    }
});

async function addToClipboard(value) {
    console.log("Initiating creation of offscreen document for clipboard write.");
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.CLIPBOARD],
        justification: 'Write text to the clipboard.'
    });
    console.log("Created offscreen document");

    // Wait for the offscreen document to be ready
    const waitForOffscreenDoc = () => new Promise(resolve => {
        const checkReady = () => {
            if (offscreenDocReady) resolve();
            else setTimeout(checkReady, 100);
            console.log("Checking if offscreen document is ready...");
        };
        checkReady();
    });

    await waitForOffscreenDoc();

    // Now that we have an offscreen document, we can dispatch the
    // message.
    await chrome.runtime.sendMessage({
        type: 'copy-data-to-clipboard',
        target: 'offscreen-doc',
        data: value
    });
    console.log("Dispatched copy-message to offscreen document");
}

const showNotification = () => {
    chrome.notifications.create('codebuddy_'+Date.now(), {
        type: 'basic',
        silent: true,
        iconUrl: 'icon-48.png',
        title: 'Data extracted',
        message: 'Open your IDE to receive the data.'
    });
}

const extractTitle = (tab, handler) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: getTitle
    }, (results) => {
        if (results) {
            let result = results[0].result;
            console.log(`Extracted title: ${result}`);
            handler(result);
        } else {
            console.log("Unable to extract title")
            handler("");
        }
    })

}

const extractText = (tab, handler) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id, allFrames: true},
        func: getContents
    }, (results) => {
        if (!results) {
            console.log("Unable to extract text");
            return;
        }
        const result = results.map((result) => result.result).join("\\n")
        console.log(`Extracted text for tab ${tab.id}`);
        handler(result);
    });
}

const extractDataAndCopy = (tab, handler) => {
    extractTitle(tab, (title) => {
        extractText(tab, (text) => {
            const id = (Math.random() * 1000000000).toFixed(0)
            const value = JSON.stringify(["codebuddyPageData", id, formatVersion, tab.url, title, text]);
            console.log("Extracted data for id : " + id);
            addToClipboard(value).then(handler);
        })
    })
}

const genericOnClick = async (info, tab) => {
    if (info.menuItemId === "sendToCodebuddy") {
        extractDataAndCopy(tab, () => {
            console.log("Data extraction and copy to clipboard completed. Sending notification.")
            showNotification()
        });
    }
};

const registerClickListener = () => {
    console.log("Registering click listener")
    chrome.contextMenus.onClicked.addListener(genericOnClick);
}

console.log("Running service-worker.js")

registerClickListener()

chrome.runtime.onInstalled.addListener(async () => {
    console.log("Adding context menu entry")
    await chrome.contextMenus.create({
        id: "sendToCodebuddy",
        title: "Send to Codebuddy",
        type: 'normal',
        contexts: ['page']
    });
    //
    // registerClickListener()
});

// chrome.runtime.onStartup.addListener(() => registerClickListener())

