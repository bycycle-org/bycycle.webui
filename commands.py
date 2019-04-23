import os
import shutil

from runcommands import command
from runcommands.commands import local, remote, sync
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
def deploy(host, to='/sites/bycycle.org/current/frontend/', build_=True, clean_=False,
           overwrite=False, dry_run=False):
    printer.header(f'Deploying to {host}...')
    if build_:
        build(clean_=clean_)
    printer.info(f'Pushing build/ to {to}...')
    sync('build/', to, host, run_as='bycycle', delete=overwrite, dry_run=dry_run, echo=True)
    printer.info(f'Setting ownership of {to}...')
    remote(('chown -R bycycle:www-data', to), sudo=True)
