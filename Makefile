venv ?= .env

init: $(venv)
	.env/bin/pip install -r requirements.txt
	.env/bin/runcommand init

$(venv):
	virtualenv -p python3.6 .env

.PHONY = init
