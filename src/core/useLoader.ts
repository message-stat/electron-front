import { createSimpleExpression } from "@vue/compiler-core";
import axios from "axios";
import { ref, Ref } from "vue";

const TIME_STEP = 1 * 60 * 60
const MESSAGE_PER_LOAD = 200
declare type Time = number
class Word {
  text: string
  date: Time

  constructor(text: string, date: Time) {
    this.text = text
    this.date = date
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const chatCountRef = ref(0)
const progress = ref(0)
const wordsProcessed = ref(0)

export function useLoader(params: {
  token: Ref<string>,
  delay: Ref<number>,
}) {

  const { token, delay } = params

  return {
    load: () => {
      load(token.value, delay.value)
    },
    chatCount: chatCountRef,
    wordsProcessed,
    progress
  }
}

async function load(token, delay) {

  let arrayOfChat = [];
  let conversationOffset = 0;
  const conversationCount = 100;
  let chatCount = 0;

  while (true) {
    const conversations = await axios.get(`https://api.vk.com/method/messages.getConversations`, {
      params: {
        access_token: token,
        offset: conversationOffset,
        count: conversationCount,
        extended: 1,
        v: '5.131'
      }
    });

    chatCount = conversations?.data?.response?.count
    chatCountRef.value = chatCount
    const items: any[] = conversations?.data?.response?.items

    await sleep(delay);
    if (items == undefined) {
      continue;
    }

    conversationOffset += items.length

    for (let i = 0; i < items.length; i++) {
      const element = items[i]?.conversation;
      const type = element?.peer?.type
      if (type != "user") {
        continue;
      }
      const peerId = element?.peer?.id

      await loadConversationMessages(peerId, token, delay);
      progress.value = (conversationOffset - (items.length - i)) / chatCount
    }

    if (conversationOffset > chatCount) {
      break;
    }
  }

}

async function loadConversationMessages(peerId, token, delay) {
  console.log("_____SEND NEW PEER ID______", peerId);

  for (let offset = 0; offset < 100000000; offset += MESSAGE_PER_LOAD) {
    const response = await axios.get(`https://api.vk.com/method/messages.getHistory`, {
      params: {
        access_token: token,
        peer_id: peerId,
        count: MESSAGE_PER_LOAD,
        offset,
        v: '5.131'
      }
    })

    const count = response?.data?.response?.count
    const items = response?.data?.response?.items

    await sleep(delay);
    if (items == undefined) {
      offset -= MESSAGE_PER_LOAD;
      console.log('timeout');

      continue;
    }

    if (count < offset) break;

    items.forEach(element => {
      const text = element?.text;
      const outFlag = element?.out;
      if (text == undefined || outFlag == 0) return;
      const t = parseText(text)
      if (t.length == 0) return;

      collectWords(t.map(t => [element.date, t].join('\t')), element.date)

    });
  }
  sendCurrentSession()
  currentWordsSession = null
}

let currentWordsSession: {
  words: Word[],
  beginTime: Time,
  date: Date
} = null

function collectWords(words: string[], messageTime: Time) {
  const createWords = (time: Time) => words.map(t => new Word(t, time))

  if (currentWordsSession && messageTime + TIME_STEP > currentWordsSession.beginTime) {
    currentWordsSession.words.push(...createWords(currentWordsSession.beginTime))
  } else {
    sendCurrentSession()
    const beginTime = roundToStep(messageTime)
    currentWordsSession = { words: createWords(beginTime), beginTime: beginTime, date: new Date(messageTime * 1000) }
  }

}

function sendCurrentSession() {
  if (!currentWordsSession) return
  // send

  wordsProcessed.value += currentWordsSession.words.length

  // if (currentWordsSession.words.some(t => t.text.split('\t')[1] == 'декодер')) {
  console.log('sendCurrentSession', currentWordsSession)
  // }
}

function roundToStep(time: Time) {
  return Math.round(time / TIME_STEP) * TIME_STEP
}

function parseText(text: string) {
  const arrayOfWord = text
    .replace(new RegExp('^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$', 'g'), '')
    .replaceAll(/\s/g, ' ')
    .split(/[^a-zа-яё\d]+/ig)
    .filter(t => t)

  return arrayOfWord
}
