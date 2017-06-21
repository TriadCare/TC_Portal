import json
from threading import Thread
import traceback
import sys


def async(f):
    def wrapper(*args, **kwargs):
        thr = Thread(target=f, args=args, kwargs=kwargs)
        thr.start()
    return wrapper


def get_request_data(request):
    form_data = request.form.to_dict()
    if len(form_data) != 0:
        return form_data

    content_type = request.headers['Content-Type']

    if content_type is None or content_type == '':
        api_error(
            AttributeError,
            'Required Headers are missing: \'Content-Type\'',
            400
        )

    if 'text/plain' in content_type:
        if request.data is None or request.data == '':
            return {}
        try:
            return json.loads(request.data)
        except ValueError:
            api_error(ValueError, 'JSON string expected.', 400)

    if 'application/json' in content_type:
        try:
            return request.json
        except ValueError:
            api_error(ValueError, 'JSON string expected.', 400)

    api_error(
        AttributeError,
        'Unsupported Content Type: "' + content_type + '"',
        415
    )


def logError(e, request):
    if e.code == 500:
        try:
            exc_info = sys.exc_info()
        finally:
            # Display the *original* exception
            print("Printing error")
            traceback.print_exception(*exc_info)
            del exc_info

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
