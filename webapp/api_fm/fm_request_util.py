import random
import json
from requests import Session, Request
from requests.auth import HTTPBasicAuth

from webapp import app
from webapp.server.util import api_error

ENDPOINT_EXCHANGE = {
    'account': app.config['FM_ACCOUNT_LAYOUT'],
    'biometric': app.config['FM_BIOMETRIC_LAYOUT'],
    'location': app.config['FM_LOCATION_LAYOUT'],
    'user': app.config['FM_USER_LAYOUT'],
    'visit': app.config['FM_VISIT_LAYOUT']
}

FM_USERNAME = app.config['FM_AUTH_NAME']
FM_PW = app.config['FM_AUTH_PW']
FM_AUTH_URL = app.config['FM_URL'] + '/' + app.config['FM_SOLUTION'] + '/sessions'
FM_URL = (
    app.config['FM_URL'] + '/' + app.config['FM_SOLUTION'] + '/layouts'
)
FM_FIND_URL = (
    app.config['FM_URL'] + '/' + app.config['FM_SOLUTION'] + '/layouts'
)

MAX_RECORD_RANGE = 250


# Generator that breaks down a request according to the MAX_RECORD_RANGE
def gen_next_query(method, url, headers, params=None, json=None):
    # get the range and offset from the provided data (defaults from 0-1000000)
    request_settings = params if json is None else json
    requested_range = (request_settings['range']
                       if 'range' in request_settings.keys()
                       and request_settings['range'] is not None
                       else 1000000)
    query_offset = (request_settings['offset']
                    if 'offset' in request_settings.keys()
                    and request_settings['offset'] is not None
                    else 0)
    # clip the range to the max
    query_range = MAX_RECORD_RANGE
    if requested_range is not None and requested_range < MAX_RECORD_RANGE:
        query_range = requested_range

    while query_offset < requested_range:
        # update the request settings
        if json is None:
            if query_offset != 0:
                params['offset'] = query_offset
            params['_limit'] = query_range
        else:
            if query_offset != 0:
                json['offset'] = query_offset
            json['limit'] = query_range
        # return the completed Request
        yield Request(
            method,
            url,
            headers=headers,
            params=params,
            json=prepare_data_for_fm(json)
        )
        # prepare the request settings for the next request
        query_offset += query_range
    # if we have exceeded the requested range, we're done
    raise StopIteration


# This function recursively stringifies all values for File Maker
def prepare_data_for_fm(obj):
    if obj is None:
        return obj
    converted_obj = {}
    for k, v in obj.iteritems():
        if isinstance(v, list):
            new_list = []
            for value in v:
                new_list.append(
                    prepare_data_for_fm(value)
                    if isinstance(value, dict) else str(value)
                )
            converted_obj[k] = new_list
        elif isinstance(v, dict):
            converted_obj[k] = prepare_data_for_fm(v)
        elif v is not None:
            converted_obj[k] = str(v)
    return converted_obj


# This function sends the provided request, and either returns the data within
# the response or the response itself if no 'data' exists
def send_fm_request(request):
    data = []
    with Session() as session:
        prepped_request = session.prepare_request(request)
        result = session.send(prepped_request).json()
        response = result['response']
        message = result['messages'][0]

        if 'code' in message.keys() and message['code'] != "0":
            api_error(
                ValueError,
                (message['message']
                 if 'message' in message.keys()
                 else 'Error from File Maker'),
                message['code']
            )

        if 'data' in response.keys():
            # Compress the response into a list of data objects
            for item in response['data']:
                d = item['fieldData']
                d['recordId'] = item['recordId']
                data.append(d)
        else:
            return response

    return data


def get_request_token():
    return send_fm_request(Request(
        'POST',
        FM_AUTH_URL,
        auth=HTTPBasicAuth(FM_USERNAME, FM_PW),
        headers={'CONTENT-TYPE': 'application/json'}
    ))['token']


# This function uses the request generator to break up the request
# and returns all of the data at once
def make_fm_find_request(endpoint, query,
                         record_range=None, record_offset=None, sort=None):
    request_gen = gen_next_query(
        'POST',
        FM_FIND_URL + '/' + ENDPOINT_EXCHANGE[endpoint] + '/_find',
        headers={
            'content-type': 'application/json',
            'Authorization': ("Bearer %s" % get_request_token())
        },
        json={
            'query': query,
            'offset': record_offset,
            'limit': record_range,
            'sort': sort
        }
    )
    data = []
    for request in request_gen:
        response = send_fm_request(request)
        if isinstance(response, list):
            data.extend(response)
            # if less than expected data is returned, we hit the end
            if len(response) < MAX_RECORD_RANGE:
                break
        # if a list is not returned, then no more data
        else:
            break

    return data


# This function gets a single record from the provided endpoint given the
# record_id
def make_fm_get_record(endpoint, record_id):
    return send_fm_request(Request(
        'GET',
        FM_URL + '/' + ENDPOINT_EXCHANGE[endpoint] + '/records/' + str(record_id),
        headers={'Authorization': ("Bearer %s" % get_request_token()) }
    ))


# This function gets a range of records from the provided endpoint.
# The generator is used to break up the request according to max request size
def make_fm_get_request(endpoint,
                        record_range=None, record_offset=None, sort=None):
    request_gen = gen_next_query(
        'GET',
        FM_URL + '/' + ENDPOINT_EXCHANGE[endpoint] + '/records/',
        headers={'Authorization': ("Bearer %s" % get_request_token()) },
        params={'_offset': record_offset, '_limit': record_range, '_sort': sort}
    )
    data = []
    for request in request_gen:
        response = send_fm_request(request)
        if isinstance(response, list):
            data.extend(response)
            # if less than expected data is returned, we hit the end
            if len(response) < MAX_RECORD_RANGE:
                break
        # if the a list is not returned, then no more data
        else:
            break

    return data


def make_fm_update_request(endpoint, record_id, data):
    return send_fm_request(Request(
        'PATCH',
        FM_URL + '/' + ENDPOINT_EXCHANGE[endpoint] + '/records/' + str(record_id),
        headers={'Authorization': ("Bearer %s" % get_request_token()) },
        json=prepare_data_for_fm({'fieldData': data})
    ))
