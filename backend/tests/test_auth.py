from .conftest import auth_headers


def test_signup_returns_user_and_token(client):
    r = client.post("/api/auth/signup", json={"username": "alice", "password": "pass123"})
    assert r.status_code == 201
    body = r.json()
    assert body["user"]["username"] == "alice"
    assert body["user"]["id"]
    assert body["token"]


def test_signup_rejects_duplicate_username(client):
    client.post("/api/auth/signup", json={"username": "alice", "password": "pass123"})
    r = client.post("/api/auth/signup", json={"username": "alice", "password": "pass123"})
    assert r.status_code == 409


def test_signup_validates_lengths(client):
    r = client.post("/api/auth/signup", json={"username": "a", "password": "x"})
    assert r.status_code == 422


def test_login_wrong_password_rejected(client):
    client.post("/api/auth/signup", json={"username": "bob", "password": "secret"})
    r = client.post("/api/auth/login", json={"username": "bob", "password": "wrong"})
    assert r.status_code == 401


def test_login_succeeds_with_correct_password(client):
    client.post("/api/auth/signup", json={"username": "bob", "password": "secret"})
    r = client.post("/api/auth/login", json={"username": "bob", "password": "secret"})
    assert r.status_code == 200
    assert r.json()["user"]["username"] == "bob"


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_current_user(client):
    headers = auth_headers(client, "carol", "pass123")
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["username"] == "carol"


def test_logout_revokes_token(client):
    headers = auth_headers(client, "dave", "pass123")
    assert client.post("/api/auth/logout", headers=headers).status_code == 204
    # token no longer valid
    assert client.get("/api/auth/me", headers=headers).status_code == 401
