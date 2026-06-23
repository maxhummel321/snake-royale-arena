from .conftest import auth_headers


def test_submit_requires_auth(client):
    r = client.post("/api/leaderboard", json={"mode": "walls", "score": 10})
    assert r.status_code == 401


def test_get_leaderboard_requires_mode(client):
    r = client.get("/api/leaderboard")
    assert r.status_code == 422


def test_submit_and_rank_scores_per_mode(client):
    headers = auth_headers(client)
    client.post("/api/leaderboard", json={"mode": "walls", "score": 30}, headers=headers)
    client.post("/api/leaderboard", json={"mode": "walls", "score": 100}, headers=headers)
    client.post("/api/leaderboard", json={"mode": "wrap", "score": 50}, headers=headers)

    walls = client.get("/api/leaderboard", params={"mode": "walls"}).json()
    assert [e["score"] for e in walls] == [100, 30]

    wrap = client.get("/api/leaderboard", params={"mode": "wrap"}).json()
    assert [e["score"] for e in wrap] == [50]


def test_leaderboard_limit(client):
    headers = auth_headers(client)
    for score in (10, 20, 30, 40):
        client.post("/api/leaderboard", json={"mode": "walls", "score": score}, headers=headers)
    top2 = client.get("/api/leaderboard", params={"mode": "walls", "limit": 2}).json()
    assert [e["score"] for e in top2] == [40, 30]


def test_score_entry_shape(client):
    headers = auth_headers(client)
    client.post("/api/leaderboard", json={"mode": "wrap", "score": 42}, headers=headers)
    entry = client.get("/api/leaderboard", params={"mode": "wrap"}).json()[0]
    assert set(entry) == {"id", "userId", "username", "mode", "score", "createdAt"}
    assert entry["score"] == 42
