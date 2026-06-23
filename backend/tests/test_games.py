from .conftest import auth_headers

STATE = {
    "snake": [{"x": 10, "y": 10}, {"x": 9, "y": 10}, {"x": 8, "y": 10}],
    "direction": "right",
    "food": {"x": 5, "y": 5},
    "score": 0,
    "mode": "walls",
    "alive": True,
    "tick": 0,
}


def _publish(client, headers, mode="walls", score=0):
    body = {"mode": mode, "score": score, "state": {**STATE, "mode": mode, "score": score}}
    return client.post("/api/games", json=body, headers=headers)


def test_active_games_empty_initially(client):
    assert client.get("/api/games/active").json() == []


def test_publish_requires_auth(client):
    r = _publish(client, headers={})
    assert r.status_code == 401


def test_publish_and_list_game(client):
    headers = auth_headers(client)
    r = _publish(client, headers, score=20)
    assert r.status_code == 201
    game = r.json()
    assert game["score"] == 20
    assert game["username"] == "alice"

    active = client.get("/api/games/active").json()
    assert len(active) == 1
    assert active[0]["id"] == game["id"]


def test_publish_upserts_one_game_per_user(client):
    headers = auth_headers(client)
    a = _publish(client, headers, score=0).json()
    b = _publish(client, headers, score=40).json()
    assert a["id"] == b["id"]
    active = client.get("/api/games/active").json()
    assert len(active) == 1
    assert active[0]["score"] == 40


def test_get_game_by_id(client):
    headers = auth_headers(client)
    game = _publish(client, headers).json()
    r = client.get(f"/api/games/{game['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == game["id"]


def test_get_unknown_game_404(client):
    assert client.get("/api/games/does-not-exist").status_code == 404


def test_end_game(client):
    headers = auth_headers(client)
    game = _publish(client, headers).json()
    assert client.delete(f"/api/games/{game['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/games/{game['id']}").status_code == 404


def test_end_game_requires_auth(client):
    headers = auth_headers(client)
    game = _publish(client, headers).json()
    assert client.delete(f"/api/games/{game['id']}").status_code == 401


def test_active_game_shape(client):
    headers = auth_headers(client)
    game = _publish(client, headers, mode="wrap", score=5).json()
    assert set(game) == {"id", "userId", "username", "mode", "score", "state", "updatedAt"}
    assert game["state"]["mode"] == "wrap"
