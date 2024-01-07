FROM python:3.11

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY assets ./assets
COPY bundle ./bundle
COPY config ./config
COPY instance/instance_config.py ./instance/
COPY webapp ./webapp
COPY index.wsgi ./

CMD [ "gunicorn", "-b", ":3000", "webapp:app", "--name", "tc_portal_webapp" ]