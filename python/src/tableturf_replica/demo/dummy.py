from tableturf_replica.bot import bot


@bot
class DummyBot:
  meta = {
    'name': 'PyDummy',
    'support': {
      'stages': [],
      'anyDeck': True,
    }
  }

  def query(self, params):
    return {
      'action': 'discard',
      'hand': 0,
    }

  @staticmethod
  def select_deck(params):
    print(params)
    return params['deck']


def main():
  DummyBot().serve(5140)
