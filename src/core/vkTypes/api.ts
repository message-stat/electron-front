import axios from "axios";
import { Conversations, History } from "./types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export namespace API {

  export async function getConversations(token: string, count: number, offset: number, timeout: number = undefined): Promise<Conversations> {
    const conversations = await axios.get(`https://api.vk.com/method/messages.getConversations`, {
      params: {
        access_token: token,
        offset: offset,
        count: count,
        v: '5.131'
      }
    });

    if (conversations.data?.error?.error_code == 6 && timeout != undefined) {
      await sleep(timeout);
      return getConversations(token, count, offset, timeout);
    }

    if (conversations.data.error) {
      throw new Error(`error: ${JSON.stringify(conversations.data.error.error_msg)}`);
    };

    return conversations.data.response as Conversations
  }

  export async function getHistory(token: string, count: number, offset: number, peerId: number, timeout: number = undefined): Promise<History> {
    const history = await axios.get(`https://api.vk.com/method/messages.getHistory`, {
      params: {
        access_token: token,
        offset: offset,
        count: count,
        peer_id: peerId,
        v: '5.131'
      }
    });

    if (history.data?.error?.error_code == 6 && timeout != undefined) {
      await sleep(timeout);
      return getHistory(token, count, offset, peerId, timeout);
    }

    if (history.data.error) {
      throw new Error(`error: ${JSON.stringify(history.data.error.error_msg)}`);
    };

    return history.data.response as History
  }
}
