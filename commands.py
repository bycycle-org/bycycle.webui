import os
import shutil
import time
from threading import Thread

from runcommands import arg, command
from runcommands.commands import local, remote, sync
from runcommands.util import abort, printer


@command
def init():
    install()


@command
def install(upgrade=False, skip_poetry=False):
    if not skip_poetry:
        local('poetry update')
    if upgrade:
        local('npm out')
        local('npm upgrade')
    else:
        local('npm install')


@command
def build(env, clean_=True):
    printer.header(f'Building for environment: {env}')
    clean_ and do_done('Cleaning...', clean, quiet=True)
    do_done('Compiling SCSS to CSS...', sass)
    do_done('Rolling up...', rollup, env, live_reload=False, quiet=True)


@command
def rollup(env, live_reload: arg(type=bool) = None, watch=False, quiet=False):
    environ = {'ENV': env}
    if live_reload is not None:
        environ['LIVE_RELOAD'] = str(int(live_reload))
    kwargs = {
        'environ': environ,
        'stdout': 'hide' if quiet else None,
        'stderr': 'capture',
        'raise_on_error': False,
    }
    result = local(('rollup', '--config', '--watch' if watch else None), **kwargs)
    if result.failed:
        abort(result.return_code, result.stderr)


@command
def sass(watch=False):
    local(('sass', '--watch' if watch else None, 'src/styles/global.scss', 'public/global.css'))


@command
def dev_server():
    printer.header('Running dev server')

    printer.info('Cleaning')
    clean(True)

    printer.info('Running scss watcher in background')
    sass_thread = Thread(target=sass, kwargs={'watch': True}, daemon=True)
    sass_thread.start()
    wait_for_file('public/global.css')

    printer.info('Running rollup watcher in background')
    rollup_thread = Thread(
        target=rollup, args=('development',), kwargs={'watch': True}, daemon=True)
    rollup_thread.start()
    wait_for_file('public/bundle.js')

    printer.info('Running server')
    local('sirv public --dev')


@command
def clean(quiet=False):
    if not quiet:
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


def do_done(message, cmd, *args, **kwargs):
    printer.info(message, end=' ', flush=True)
    cmd(*args, **kwargs)
    printer.success('Done')


def wait_for_file(file):
    waited = False
    while not os.path.exists(file):
        if not waited:
            print(f'Waiting for {file}...')
        time.sleep(0.5)
        waited = True
