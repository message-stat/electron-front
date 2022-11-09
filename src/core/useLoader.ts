import { createSimpleExpression } from "@vue/compiler-core";
import axios from "axios";
import { ref, Ref } from "vue";

import { IWord, ISendSession } from 'common/interfaces/IWord'

import { API } from "./vkTypes/api";

const TIME_STEP = 1 * 60 * 60 * 24
const MESSAGE_PER_LOAD = 200
const CONVERSATION_PER_LOAD = 20

declare type VKTime = number

class Word implements IWord {
  text: string
  date: Date

  debug: string

  constructor(text: string, date: VKTime, debug: string) {
    this.text = text
    this.date = new Date(date * 1000)
    this.debug = debug
  }
}

type SendSession = ISendSession & {
  vkDate: VKTime
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


const chatCountRef = ref(0)
const messagesCountRef = ref(0)
const messageProcessedRef = ref(0)
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
    messagesCount: messagesCountRef,
    wordsProcessed,
    progress
  }
}

let sessionsToSend: ISendSession[] = []
function sendSession(session: ISendSession) {
  sessionsToSend.push({ words: session.words, beginTime: session.beginTime })
}

async function sendLoop() {
  while (true) {
    if (sessionsToSend.length) {
      console.log('send', sessionsToSend.length, 'sessions');

      await axios.post('http://localhost:8000/api/sendWord', sessionsToSend)
      sessionsToSend = []
    } else {
      await sleep(200)
    }
  }
}

sendLoop()

async function load(token: string, delay: number) {
  const chatCount = (await API.getConversations(token, 1, 0, delay)).count;

  const conversations: {
    peerId: number
    totalMessages: number
  }[] = []


  for (let offset = 0; offset < chatCount && offset < 10; offset += CONVERSATION_PER_LOAD) {
    const t = await API.getConversations(token, CONVERSATION_PER_LOAD, offset)
    const peers = t.items.filter(t => t.conversation.peer.type == 'user')

    for (let i = 0; i < peers.length; i++) {
      console.log('preload', offset + i, 'of', chatCount);

      const id = peers[i].conversation.peer.id
      conversations.push({
        peerId: id,
        totalMessages: (await API.getHistory(token, 1, 0, id, delay)).count
      })

      await sleep(delay)
    }
  }

  const totalMessages = conversations.reduce((a, b) => a + b.totalMessages, 0)

  console.log('totalMessages', totalMessages);
  chatCountRef.value = chatCount
  messagesCountRef.value = totalMessages


  for (let i = 0; i < conversations.length; i++) {
    const conversation = conversations[i]
    console.log('load', i, 'of', conversations.length);

    await loadConversationMessages(token, conversation.peerId, conversation.totalMessages, delay)
    await sleep(delay)
  }

}

async function loadConversationMessages(token: string, peerId: number, totalMessages: number, delay: number) {

  for (let offset = 0; offset < totalMessages; offset += MESSAGE_PER_LOAD) {
    await sleep(delay);
    const messages = await API.getHistory(token, MESSAGE_PER_LOAD, offset, peerId, delay)

    let currentSession: SendSession = null

    messages.items
      .filter(t => t.out)
      .forEach(message => {
        const words = parseText(message.text)
        const roundedTime = roundToStep(message.date)

        const wordsToSend = words.map(t => new Word(t, roundedTime, message.text))

        if (currentSession?.vkDate == roundedTime) {
          currentSession.words.push(...wordsToSend)
        } else {
          if (currentSession) {
            sendSession(currentSession)
            wordsProcessed.value += currentSession.words.length
            progress.value = messageProcessedRef.value / messagesCountRef.value
          }

          currentSession = { words: wordsToSend, beginTime: new Date(1000 * roundedTime), vkDate: roundedTime }
        }

        messageProcessedRef.value++
      })

    if (currentSession) sendSession(currentSession)
    currentSession = null
  }

}

function roundToStep(time: VKTime) {
  return Math.round(time / TIME_STEP) * TIME_STEP
}

function parseText(text: string) {
  const arrayOfWord = text
    .replaceAll('\n', ' ')
    .replace(new RegExp('^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$', 'g'), '')
    .replaceAll(/\s/g, ' ')
    .split(/[^a-zа-яё\d]+/ig)
    .filter(t => t)

  return arrayOfWord
}
