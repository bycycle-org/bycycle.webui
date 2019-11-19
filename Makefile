init:
	poetry install
	./.venv/bin/runcommand init

.PHONY = init
