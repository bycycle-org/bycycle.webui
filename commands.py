import os

from runcommands import command
from runcommands.commands import local, show_config


@command
def init(config):
    local(config, 'npm install')
    if not os.path.exists('.env'):
        local(config, 'virtualenv -p python3.6 .env')
    local(config, '.env/bin/pip install -r requirements.txt')


@command
def build(config):
    local(config, 'npm run build')


@command(default_env='production')
def deploy(config, build_=True):
    if build_:
        build(config)
    local(config, (
        'rsync',
        '--rsync-path "sudo -u bycycle rsync"',
        '-rltvz',
        'build/ bycycle.org:/sites/bycycle.org/frontend/',
    ))
