from tableturf_replica import bot, api

def test_import():
  pass

def test_api():
  assert api.getCardById(1)['name'] == 'HeroShooter'
