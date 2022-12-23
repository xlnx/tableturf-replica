import os
import js2py
import subprocess
from textwrap import dedent
from setuptools import setup
from distutils.dir_util import copy_tree
from setuptools.command.build_py import build_py


cur_path = os.path.dirname(os.path.abspath(__file__))


class BuildPyCommand(build_py):

  def run(self):
    target_dir = os.path.join(self.build_lib, 'tableturf_replica')
    self.mkpath(target_dir)

    python_path = os.path.join(cur_path, 'python/tableturf_replica')
    copy_tree(python_path, target_dir)

    api_path = os.path.join(cur_path, 'src/core')
    subprocess.check_call('yarn install --frozen-lockfile', cwd=api_path, shell=True)
    subprocess.check_call(f'npx webpack --mode=production', cwd=api_path, shell=True)
    with open(os.path.join(api_path, 'dist/api.js'), 'r') as f:
      js = 'var exports={};\n' + f.read()
    py = js2py.translate_js(js) + dedent('''\
      \n
      from tableturf_replica.api_wrapper import ApiWrapper
      api = ApiWrapper(var['exports']['api'].to_python())
      __all__ = ['api']
    ''')
    with open(os.path.join(target_dir, 'api.py'), 'w') as f:
      f.write(py)

    build_py.run(self)

setup(
  name="tableturf_replica",
  version="0.0.2",
  cmdclass={
    'build_py': BuildPyCommand,
  },
  packages=['.'],
  install_requires=[
    'js2py',
    'typeguard',
    'websockets',
  ]
)
