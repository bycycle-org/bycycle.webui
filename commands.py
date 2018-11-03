import os
import shutil

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
def build(clean_=False):
    if clean_:
        clean()
    local('npm run build')


@command
def clean():
    def rmdir(path):
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            printer.warning(
                'Path does not exist or is not a directory: {path}'
                .format_map(locals()))
    rmdir('build')


@command
def deploy(host, build_=True, clean_=False):
    if build_:
        build(clean_=clean_)
    sync('build/', '/sites/bycycle.org/frontend/', host, run_as='bycycle')
