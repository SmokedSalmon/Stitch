import MessageService from '../MessageService'

let dateNowSpy
beforeAll(() => {
  // Lock Time
  dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)
})

afterAll(() => {
  // Unlock Time
  dateNowSpy.mockRestore()
})

describe('MessageService', () => {
  it('sub a topic', () => {
    let testString
    // create a function to subscribe to topics
    const mySubscriber = function ({ data }) {
      testString = data.message
    }

    // add the function to the list of subscribers for a particular topic
    MessageService.sub('MY TOPIC', mySubscriber)

    // publish a topic
    MessageService.post('tester', 'MY TOPIC', { message: 'hello world!' })
    expect(testString).toBe('hello world!')
  })

  it('unsub a topic', () => {
    // create a function to subscribe to topics
    const hanlder = function ({ data }) {
      console.log(data)
    }

    // add the function to the list of subscribers for a particular topic
    MessageService.sub('pew pew', hanlder)

    // unsub a topic
    MessageService.unsub('pew pew', hanlder)
    expect(MessageService.hasTopic('pew pew')).toBe(false)
  })

  it('post a topic with handlers internal error info', () => {
    let testString
    global.console = {error: jest.fn()}
    // create two function to subscribe to topics
    const mySubscriberA = function ({ data }) {
      testString = data.message
    }

    const mySubscriberB = function ({ data }) {
      JSON.parse(data.notExistkey)
    }

    // add the function to the list of subscribers for a particular topic
    MessageService.sub('MY TOPIC', mySubscriberA)

    MessageService.sub('MY TOPIC', mySubscriberB)

    // publish
    MessageService.post('tester', 'MY TOPIC', { message: 'hello world!' })
    expect(console.error).toBeCalled()
  })

  it('send message to a MFE-A topic chanel, after 4000ms get a promise resovle value', () => {
    const sender = 'MFE-B'
    const p1 = new Promise((res) => setTimeout(() => res('p1'), 4000))
    MessageService.sub('MFE-A:Message', () => p1)
    expect.assertions(1)
    return expect(MessageService.send(sender, 'MFE-A:Message', {})).resolves.toEqual({
      type: 'Send',
      policy: 'First',
      time: 1487076708000,
      topic: 'MFE-A:Message',
      sender: 'MFE-B',
      status: 'Success',
      data: ['p1']
    })
  })

  it('send message to a MFE-B topic chanel, after 7000ms get a promise error because of timeout', () => {
    const sender = 'MFE-A'
    const p2 = new Promise((res) => setTimeout(() => res('p2'), 7000))
    MessageService.sub('MFE-B:Message', () => p2)
    return expect(MessageService.send(sender, 'MFE-B:Message', {})).rejects.toEqual({
      type: 'Send',
      policy: 'First',
      time: 1487076708000,
      topic: 'MFE-B:Message',
      sender: 'MFE-A',
      status: 'Failed',
      data: { error: 'timeout error' }
    })
  })

  it('send message to a MFE-C topic chanel, get a promise error because of reject', () => {
    const sender = 'MFE-A'
    const fn = async () => {
      const p3 = await new Promise((_res, rej) => setTimeout(() => rej('p3'), 500))
      return p3
    }
    MessageService.sub('MFE-C:Message', fn)
    expect.assertions(1)
    return expect(MessageService.send(sender, 'MFE-C:Message', {})).rejects.toEqual({
      type: 'Send',
      policy: 'First',
      time: 1487076708000,
      topic: 'MFE-C:Message',
      sender: 'MFE-A',
      status: 'Failed',
      data: { error: 'promise rejection' }
    })
  })
})
