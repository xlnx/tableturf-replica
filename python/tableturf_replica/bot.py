__all__ = ['bot']


import asyncio
import websockets
from uuid import uuid4
from abc import ABC, abstractmethod
from typing import Tuple, List, Dict, Any, Optional
from typeguard import typechecked
from tableturf_replica.endpoint import Endpoint
from tableturf_replica.logger import get_logger


logger = get_logger('Bot')


@typechecked
class Bot(ABC):
  def serve(self, port: int, **kwargs):
    logger.info('serving on ws://0.0.0.0:{}'.format(port))
    asyncio.run(self._serve(port, **kwargs))

  async def _serve(self, port, **kwargs):
    async with websockets.serve(self._handle, '0.0.0.0', port, **kwargs):
      await asyncio.Future()

  async def _handle(self, ws):
    await BotEndpoint(self, ws).run()

  @abstractmethod
  def get_info(self) -> Dict[str, Any]:
    raise NotImplementedError()


@typechecked
class BotSession:
  def initialize(self, params) -> None:
    pass

  def query(self, params) -> Dict[str, Any]:
    raise NotImplementedError()

  def update(self, params) -> None:
    pass

  def finalize(self, params) -> None:
    pass

  @staticmethod
  def select_deck(params) -> Optional[List[int]]:
    raise NotImplementedError()


class BotEndpoint(Endpoint):
  def __init__(self, bot: Bot, ws) -> None:
    super().__init__(ws)
    self._bot = bot
    self._sessions: Dict[str, BotSession] = {}

  def get_bot_info(self, params):
    return self._bot.get_info()

  def create_session(self, params):
    session, deck = self._bot.create_session(params)
    session_id = str(uuid4())
    self._sessions[session_id] = session
    return {
      'session': session_id,
      'deck': deck
    }

  def session_initialize(self, params):
    return self._sessions[params['session']].initialize(params['params'])

  def session_query(self, params):
    return self._sessions[params['session']].query(params['params'])

  def session_update(self, params):
    return self._sessions[params['session']].update(params['params'])

  def session_finalize(self, params):
    return self._sessions[params['session']].finalize(params['params'])


def bot(cls):
  class InnerSession(cls, BotSession):
    pass

  @typechecked
  class InnerBot(Bot):
    def get_info(self) -> Dict[str, Any]:
      return cls.meta

    def create_session(self, params) -> Tuple[BotSession, Optional[List[int]]]:
      deck = InnerSession.select_deck(params)
      return InnerSession(), deck

  return InnerBot
