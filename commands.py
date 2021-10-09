import os
import shutil
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from runcommands import arg, command
from runcommands.commands import git_version, local, remote, sync
from runcommands.util import abort, confirm, printer


@command
def init():
    install()


@command
def install(upgrade=False, skip_python=False):
    if not skip_python:
        local('.venv/bin/pip install --upgrade --upgrade-strategy eager pip setuptools')
        if upgrade:
            local('poetry update')
    if upgrade:
        local('npm out', raise_on_error=False)
        local('npm upgrade')
    else:
        local('npm install')


@command
def build(env, clean_=True, verbose=False):
    printer.header(f'Building for environment: {env}')
    quiet = not verbose
    end = None if verbose else ' '
    clean_ and do_done(f'Cleaning...', clean, quiet=quiet, _end=end)
    do_done(f'Compiling SCSS to CSS...', sass, quiet=quiet, _end=end)
    do_done(f'Rolling up...', rollup, env, live_reload=False, quiet=quiet, _end=end)


@command
def rollup(env, live_reload: arg(type=bool) = None, watch=False, quiet=False):
    environ = {'NODE_ENV': env}
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
def sass(sources: arg(container=tuple), watch=False, quiet=False):
    args = []
    destinations = []
    for source in sources:
        name = os.path.basename(source)
        root, ext = os.path.splitext(name)
        destination = os.path.join('public', 'build', f'{root}.css')
        args.append(f'{source}:{destination}')
        destinations.append(destination)
    local(('sass', '--watch' if watch else None, *args))
    if not quiet:
        for source, destination in zip(sources, destinations):
            print(f'Compiled {source} to {destination}')


@command
def dev_server(default_args, host='localhost', port=5000, directory='public'):
    printer.header('Running dev server')

    printer.hr('Cleaning', color='info')
    clean()

    printer.info('Running scss watcher in background')
    sass_args = ['sass', '--watch']
    for source in default_args['sass']['sources']:
        name = os.path.basename(source)
        root, ext = os.path.splitext(name)
        destination = os.path.join('public', 'build', f'{root}.css')
        sass_args.append(f'{source}:{destination}')
    local(sass_args, background=True, environ={
        'NODE_ENV': 'development',
    })
    wait_for_file(destination)

    printer.hr('Running rollup watcher in background', color='info')
    local(['rollup', '--config', '--watch'], background=True, environ={
        'NODE_ENV': 'development',
        'LIVE_RELOAD': 'true',
    })
    wait_for_file('public/build/bundle.js')

    printer.hr(f'Serving {directory} directory at http://{host}:{port}/', color='info')

    class RequestHandler(SimpleHTTPRequestHandler):

        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)

        def translate_path(self, path):
            path = super().translate_path(path)
            if not os.path.exists(path):
                path = os.path.join(self.directory, 'index.html')
            return path

    server = ThreadingHTTPServer((host, port), RequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        abort(message='Shut down dev server')


@command
def clean(quiet=False):
    def rmdir(path):
        if os.path.isdir(path):
            shutil.rmtree(path)
            if not quiet:
                printer(f'Removed directory: {path}')
        else:
            if not quiet:
                printer.warning(f'Path does not exist or is not a directory: {path}')

    rmdir('__pycache__')
    rmdir('public/build')


@command
def deploy(env, host, version=None, build_=True, clean_=True, verbose=False, push=True,
           overwrite=False, chown=True, chmod=True, link=True, dry_run=False):
    if env == 'development':
        abort(1, 'Can\'t deploy to development environment')
    version = version or git_version()
    root_dir = f'/sites/{host}/webui'
    build_dir = f'{root_dir}/builds/{version}'
    link_path = f'{root_dir}/current'
    real_run = not dry_run

    printer.hr(
        f'{"[DRY RUN] " if dry_run else ""}Deploying version {version} to {env}',
        color='header')
    printer.header('Host:', host)
    printer.header('Remote root directory:', root_dir)
    printer.header('Remote build directory:', build_dir)
    printer.header('Remote link to current build:', link_path)
    printer.header('Steps:')
    printer.header(f'  - {"Cleaning" if clean_ else "Not cleaning"}')
    printer.header(f'  - {"Building" if build_ else "Not building"}')
    printer.header(f'  - {f"Pushing" if push else "Not pushing"}')
    printer.header(f'  - {f"Setting owner" if chown else "Not setting owner"}')
    printer.header(f'  - {f"Setting permissions" if chmod else "Not setting permissions"}')
    if overwrite:
        printer.warning(f'  - Overwriting {build_dir}')
    printer.header(f'  - {"Linking" if link else "Not linking"}')

    confirm(f'Continue with deployment of version {version} to {env}?', abort_on_unconfirmed=True)

    if build_:
        build(env, clean_=clean_, verbose=verbose)

    if push:
        remote(f'test -d {build_dir} || mkdir -p {build_dir}')
        printer.info(f'Pushing public/ to {build_dir}...')
        sync('public/', f'{build_dir}/', host, delete=overwrite, dry_run=dry_run, echo=verbose)

    if chown:
        owner = 'bycycle:www-data'
        printer.info(f'Setting ownership of {build_dir} to {owner}...')
        if real_run:
            remote(('chown', '-R', owner, build_dir), sudo=True)

    if chmod:
        mode = 'u=rwX,g=rwX,o='
        printer.info(f'Setting permissions on {build_dir} to {mode}...')
        if real_run:
            remote(('chmod', '-R', mode, build_dir), sudo=True)

    if link:
        printer.info(f'Linking {link_path} to {build_dir}')
        if real_run:
            remote(('ln', '-sfn', build_dir, link_path))


def do_done(message, cmd, *args, _end=' ', **kwargs):
    printer.info(message, end=_end, flush=True)
    cmd(*args, **kwargs)
    printer.success('Done')


def wait_for_file(file):
    waited = False
    while not os.path.exists(file):
        if not waited:
            print(f'Waiting for {file}...')
        time.sleep(0.5)
        waited = True
