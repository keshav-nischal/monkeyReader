import redis

def generateAgentChatSessionId():
    return 1231

def redisMain():
    print("working")
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.set("userId", "bar")
    print(r.get("foo"))

