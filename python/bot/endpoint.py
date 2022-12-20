__all__ = ['Endpoint']


import json
import logging
import traceback
from .logger import get_logger


logger = get_logger('Endpoint')
logger.setLevel(logging.INFO)


ERR_METHOD_NOT_FOUND = -32601
ERR_FAIL = -32000


class Endpoint:
  def __init__(self, ws) -> None:
    logger.info('connection established: %s -> %s',
                ws.remote_address[0], ws.path)
    self._ws = ws

  async def run(self):
    while True:
      msg = await self._ws.recv()
      await self._on_msg(msg)

  async def _on_msg(self, msg: str):
    logger.debug("recv %s", msg);
    try:
      msg = json.loads(msg)
      assert msg['jsonrpc'] == '2.0'
      if 'method' in msg:
        await self._on_recv_request(msg)
      else:
        await self._on_recv_response(msg)
    except Exception as e:
      logger.error("error: %s", str(e))

  async def _on_recv_request(self, request):
    async def send(data):
      await self._ws.send(json.dumps(data))
    async def resolve(val):
      logger.debug("response: %o", val);
      await send({
        'jsonrpc': '2.0',
        'id': request['id'],
        'result': val,
      })
    async def reject(code, msg):
      logger.error("error[%d]: %s", code, msg);
      await send({
        'jsonrpc': '2.0',
        'id': request['id'],
        'error': {
          'code': code,
          'message': msg,
        }
      })
    # forbit rpc private method
    method = request['method']
    if method.startswith('_'):
      return await reject(ERR_METHOD_NOT_FOUND, method)
    # find method
    cls = self.__class__
    while True:
      if cls is Endpoint:
        # no such method
        return await reject(ERR_METHOD_NOT_FOUND, method)
      if method in cls.__dict__:
        # found
        break
      cls = cls.__base__
    try:
      # execute method
      params = request.get('params', None)
      logger.debug("run {}({})".format(method, params))
      f = getattr(self, method)
      val = f(params)
      return await resolve(val)
    except Exception as e:
      # exec failed
      tb = traceback.format_exc()
      logger.error("%s\n: %s", repr(e), str(tb));
      return await reject(ERR_FAIL, repr(e))

  async def _on_recv_response(self, response):
    raise NotImplementedError()
