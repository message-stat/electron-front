
export type Conversations = {
  count: number
  items: {
    conversation: Conversation
  }[]
}

export type Conversation = {
  peer: {
    id: number
    type: 'user' | 'chat' | 'group' | 'email'
    local_id: number
  }
}

export type History = {
  count: number
  items: Message[]
}

export type Message = {
  id: number
  from_id: number
  date: number
  text: string
  out: number
}


