from bot import bot


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


if __name__ == "__main__":
  DummyBot().serve(5140)
