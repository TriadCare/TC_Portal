from json import dumps
import inspect


def logError(e, request):
    print("\n !!! Error received: " + str(type(e)) + str(e))
    print(" !!! Error code: " + str(e.code))
    print(" !!! User Agent: " + request.user_agent.string)
    print(" !!! User IP: " + request.remote_addr)
    # print(" !!! Headers: " + str(type(request.headers)))
    print(" !!! URL Requested: " + request.url)
    if request.method is 'POST':
        print(" !!! Post data: " + request.data)
    print(" !!! Referrer: " + str(request.referrer) + "\n")


def api_error(err_type=Exception, message="An API Error occurred.", code=500):
    error = err_type(message)
    error.code = code
    raise error
