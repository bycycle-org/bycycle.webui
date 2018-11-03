venv ?= .venv

init: $(venv)
	$(venv)/bin/pip install -r requirements.txt
	$(venv)/bin/runcommand init

$(venv):
	python3 -m venv $(venv)

.PHONY = init
