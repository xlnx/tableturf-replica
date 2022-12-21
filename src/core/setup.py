import os
import js2py
import subprocess
from textwrap import dedent
from setuptools import setup
from setuptools.command.build_py import build_py

cur_path = os.path.dirname(os.path.abspath(__file__))


class BuildPyCommand(build_py):

  def run(self):
    subprocess.check_call('yarn install --frozen-lockfile', cwd=cur_path, shell=True)
    subprocess.check_call(f'npx webpack --mode=production', cwd=cur_path, shell=True)
    with open(os.path.join(cur_path, 'dist/api.js'), 'r') as f:
      js = 'var exports={};\n' + f.read()
    py = js2py.translate_js(js) + dedent('''\
      \n
      api = var['exports']['api'].to_python()
      __all__ = ['api']
    ''')

    target_dir = os.path.join(self.build_lib, 'tableturf_replica_internal')
    self.mkpath(target_dir)
    with open(os.path.join(target_dir, 'api.py'), 'w') as f:
      f.write(py)

    build_py.run(self)


setup(
  name="tableturf_replica_internal",
  version="0.0.1",
  cmdclass={
    'build_py': BuildPyCommand,
  },
  install_requires=[
    'js2py',
  ]
)
