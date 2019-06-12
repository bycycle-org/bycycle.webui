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
def clean(quiet=False):
    printer.header('Cleaning up...')

    def rmfile(file):
        if os.path.isfile(file):
            os.remove(file)
            if not quiet:
                printer.info(f'Removed file: {file}')
        else:
            if not quiet:
                printer.warning(f'Path does not exist or is not a file: {file}')

    def rmdir(path):
        if os.path.isdir(path):
            shutil.rmtree(path)
            if not quiet:
                printer.info(f'Removed directory: {path}')
        else:
            if not quiet:
                printer.warning(f'Path does not exist or is not a directory: {path}')

    rmdir('__pycache__')

    for file in (
        'public/bundle.css',
        'public/bundle.css.map',
        'public/bundle.js',
        'public/bundle.js.map',
        'public/global.css',
        'public/global.css.map',
    ):
        rmfile(file)


@command
def deploy(host, to='/sites/bycycle.org/current/frontend/', build_=True, clean_=True,
           overwrite=False, dry_run=False):
    printer.header(f'Deploying to {host}...')
    if build_:
        build(clean_=clean_)
    printer.info(f'Pushing build/ to {to}...')
    sync('public/', to, host, run_as='bycycle', delete=overwrite, dry_run=dry_run, echo=True)
    printer.info(f'Setting ownership of {to}...')
    remote(('chown -R bycycle:www-data', to), sudo=True)
