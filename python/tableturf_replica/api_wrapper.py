from typing import Any, Iterable
from typeguard import typechecked
from js2py.base import JsObjectWrapper


@typechecked
class ApiWrapper:
  def __init__(self, api: JsObjectWrapper) -> None:
    self._api = api

  def __getattr__(self, key) -> Any:
    api = self._api[key]
    if isinstance(api, JsObjectWrapper):
      return ApiWrapper(api)
    return api

  def __getitem__(self, key) -> Any:
    return self.__getattr__(key)

  def __call__(self, *args: Any, **kwds: Any) -> Any:
    api = self._api(*args, **kwds)
    if isinstance(api, JsObjectWrapper):
      return eval(str(api))
    return api

  def __repr__(self) -> str:
    return self._api.__repr__()

  def __dir__(self) -> Iterable[str]:
    return self._api.__dir__()
