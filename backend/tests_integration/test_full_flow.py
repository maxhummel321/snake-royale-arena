"""Full-flow integration tests against an on-disk SQLite database."""


def test_signup_login_submit_readback(client):
    # sign up
    r = client.post("/api/auth/signup", json={"username": "erika", "password": "pass123"})
    assert r.status_code == 201
    token = r.json()["token"]

    # log out, then log back in (a separate request -> separate DB connection)
    assert client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"}).status_code == 204
    r = client.post("/api/auth/login", json={"username": "erika", "password": "pass123"})
    assert r.status_code == 200
    token = r.json()["token"]

    # submit a score
    r = client.post(
        "/api/leaderboard",
        json={"mode": "walls", "score": 137},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201

    # read it back from the leaderboard
    lb = client.get("/api/leaderboard", params={"mode": "walls"}).json()
    assert [(e["username"], e["score"]) for e in lb] == [("erika", 137)]


def test_data_survives_across_connections(client):
    # write a user + score through the API
    token = client.post(
        "/api/auth/signup", json={"username": "frank", "password": "pass123"}
    ).json()["token"]
    client.post(
        "/api/leaderboard",
        json={"mode": "wrap", "score": 55},
        headers={"Authorization": f"Bearer {token}"},
    )

    # drop all pooled DB connections, simulating a fresh process
    from app.database import engine

    engine.dispose()

    # a brand-new connection must still see the persisted score
    lb = client.get("/api/leaderboard", params={"mode": "wrap"}).json()
    assert any(e["username"] == "frank" and e["score"] == 55 for e in lb)
