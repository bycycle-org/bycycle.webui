from runcommands import command
from runcommands.commands import local, sync
from runcommands.util import printer


@command
def init():
    install()


@command
def install(upgrade=False):
    local('npm install')
    if upgrade:
        local('npm upgrade')


@command
def build():
    local('npm run build')


@command
def deploy(host, build_=True):
    if build_:
        build()
    sync('build/', '/sites/bycycle.org/frontend/', host, run_as='bycycle')
