from tableturf_replica import bot


@bot
class DummyBot:
  meta = {
    'name': 'PyDummy',
    'support': {
      'stages': [],
      'decks': [],
    }
  }

  def query(self, params):
    return {
      'action': 'discard',
      'hand': 0,
    }


def main():
  DummyBot().serve(5140)
