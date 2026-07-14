"""
STRYK - End-to-End 3v3 Verification Test
=========================================
Run from the backend/ directory:
    python scripts/e2e_test_3v3.py

Prerequisites:
  - Backend server running on http://127.0.0.1:8000
  - ALLOW_DEMO_AUTH=true in .env
  - APP_ENV=development in .env

Flow:
  1. Register / upsert 6 demo players
  2. Create 3v3 match (host = P1)
  3. P2-P6 join
  4. All 6 check in
  5. Assign teams: P1/P2/P3 -> Team A, P4/P5/P6 -> Team B
  6. Host closes match (score 2-1)
  7. All 6 submit stats
  8. P1-P4 each get 3 approvals (quorum met) -> VERIFIED
  9. P5-P6 get 0 votes -> VOIDED on complete
 10. Host calls /complete
 11. Assert & print results
"""

import asyncio
import sys
import httpx

BASE = "https://stryk-production-c476.up.railway.app/api/v1"

PLAYERS = [
    {"clerkId": "demo_p1", "username": "striker_demo",   "fullName": "Alex Striker",   "position": "CF",  "playStyle": "Poacher",    "strongFoot": "Right"},
    {"clerkId": "demo_p2", "username": "playmaker_demo", "fullName": "Ben Playmaker",  "position": "CMF", "playStyle": "Playmaker",  "strongFoot": "Right"},
    {"clerkId": "demo_p3", "username": "keeper_demo",    "fullName": "Chris Keeper",   "position": "GK",  "playStyle": "Sweeper",    "strongFoot": "Left"},
    {"clerkId": "demo_p4", "username": "defender_demo",  "fullName": "Dan Defender",   "position": "CB",  "playStyle": "Destroyer",  "strongFoot": "Right"},
    {"clerkId": "demo_p5", "username": "winger_demo",    "fullName": "Eve Winger",     "position": "LWF", "playStyle": "Dribbler",   "strongFoot": "Left"},
    {"clerkId": "demo_p6", "username": "dmf_demo",       "fullName": "Frank Midfield", "position": "DMF", "playStyle": "Box-to-Box", "strongFoot": "Right"},
]

STATS = [
    {"goals": 2, "assists": 1, "saves": 0, "tackles": 1},   # P1 Team A – VERIFIED (2 goals fills team cap)
    {"goals": 0, "assists": 2, "saves": 0, "tackles": 3},   # P2 Team A – VERIFIED (no goals left)
    {"goals": 0, "assists": 0, "saves": 3, "tackles": 0},   # P3 Team A GK – VERIFIED
    {"goals": 0, "assists": 0, "saves": 0, "tackles": 5},   # P4 Team B – VERIFIED
    {"goals": 1, "assists": 0, "saves": 0, "tackles": 2},   # P5 Team B – VOIDED (1 goal, Team B scored 1)
    {"goals": 0, "assists": 1, "saves": 0, "tackles": 1},   # P6 Team B – VOIDED
]

VERIFIED_INDICES = {0, 1, 2, 3}
VOIDED_INDICES   = {4, 5}

def hdrs(clerk_id):
    return {"Authorization": f"Bearer mock_{clerk_id}"}

def ok(resp, label):
    if resp.status_code not in (200, 201):
        print(f"\n  FAIL  {label} [{resp.status_code}]: {resp.text[:300]}")
        sys.exit(1)
    data = resp.json()
    if not data.get("success", True):
        print(f"\n  FAIL  {label}: {data}")
        sys.exit(1)
    print(f"   OK   {label}")
    return data

async def run():
    async with httpx.AsyncClient(timeout=30.0) as c:

        # Step 1: Register players
        print("\n== Step 1: Register 6 demo players ==")
        me_ids = {}
        for p in PLAYERS:
            await c.post(f"{BASE}/profile", json={
                "username": p["username"], "fullName": p["fullName"],
                "position": p["position"], "playStyle": p["playStyle"],
                "strongFoot": p["strongFoot"], "bio": "E2E test account",
            }, headers=hdrs(p["clerkId"]))
            resp = await c.get(f"{BASE}/profile/me", headers=hdrs(p["clerkId"]))
            d = ok(resp, f"Fetch me: {p['username']}")
            u = d.get("data") or d.get("player") or d
            me_ids[p["clerkId"]] = u.get("id") or u.get("userId")
            print(f"        id={me_ids[p['clerkId']]}")

        # Step 2: Snapshot BEFORE
        print("\n== Step 2: BEFORE snapshot ==")
        before = {}
        for p in PLAYERS:
            resp = await c.get(f"{BASE}/profile/me", headers=hdrs(p["clerkId"]))
            u = (resp.json().get("data") or resp.json().get("player") or resp.json())
            before[p["clerkId"]] = {
                "matchesPlayed":      u.get("matchesPlayed", 0),
                "goals":              u.get("goals", 0),
                "assists":            u.get("assists", 0),
                "progressionPoints":  u.get("progressionPoints", 0),
                "verifiedMatchCount": u.get("verifiedMatchCount", 0),
            }
            print(f"   {p['username']:22s}  mp={before[p['clerkId']]['matchesPlayed']}  g={before[p['clerkId']]['goals']}  a={before[p['clerkId']]['assists']}")

        host = PLAYERS[0]

        # Step 3: Create match
        print("\n== Step 3: Create 3v3 match ==")
        resp = await c.post(f"{BASE}/matches/", json={
            "title": "E2E 3v3 Test Match", "location": "Test Turf, Pune",
            "date_time": "2026-07-14T15:00:00", "max_players": 6, "format": "3v3",
        }, headers=hdrs(host["clerkId"]))
        md = ok(resp, "Create match")
        match_id = (md.get("data") or md).get("id")
        print(f"        match_id={match_id}")

        # Step 4: Join
        print("\n== Step 4: Players 2-6 join ==")
        for p in PLAYERS[1:]:
            resp = await c.post(f"{BASE}/matches/join", json={"matchId": match_id}, headers=hdrs(p["clerkId"]))
            ok(resp, f"{p['username']} joins")

        # Step 5: Get participant IDs
        print("\n== Step 5: Fetch participant IDs ==")
        resp = await c.get(f"{BASE}/matches/{match_id}", headers=hdrs(host["clerkId"]))
        md2 = ok(resp, "Fetch match")
        parts = (md2.get("data") or md2).get("participants", [])
        pid_map = {p["userId"]: p["id"] for p in parts}
        print(f"        participant map: {pid_map}")

        # Step 6: Check in all
        print("\n== Step 6: All 6 check in ==")
        for p in PLAYERS:
            resp = await c.post(f"{BASE}/matches/check-in", json={"matchId": match_id}, headers=hdrs(p["clerkId"]))
            ok(resp, f"{p['username']} checks in")

        # Step 7: Assign teams
        print("\n== Step 7: Assign teams ==")
        teams = ["A", "A", "A", "B", "B", "B"]
        for i, p in enumerate(PLAYERS):
            db_id = me_ids[p["clerkId"]]
            pid = pid_map.get(db_id)
            if not pid:
                print(f"   WARN: no participantId for {p['username']} (db_id={db_id})")
                continue
            resp = await c.post(f"{BASE}/matches/assign-team",
                json={"matchId": match_id, "participantId": pid, "team": teams[i]},
                headers=hdrs(host["clerkId"]))
            ok(resp, f"{p['username']} -> {teams[i]}")

        # Step 8: Close match
        print("\n== Step 8: Close match (2-1) ==")
        resp = await c.post(f"{BASE}/matches/{match_id}/close",
            json={"teamAScore": 2, "teamBScore": 1}, headers=hdrs(host["clerkId"]))
        ok(resp, "Close match")

        # Step 9: Submit stats
        print("\n== Step 9: All 6 submit stats ==")
        for i, p in enumerate(PLAYERS):
            resp = await c.post(f"{BASE}/matches/{match_id}/submit-stats",
                json=STATS[i], headers=hdrs(p["clerkId"]))
            ok(resp, f"{p['username']} submits {STATS[i]}")

        # Step 10: Verify P1-P4 (each gets 3+ approvals)
        print("\n== Step 10: Cross-verify P1-P4 (P5-P6 get no votes) ==")
        for vi, voter in enumerate(PLAYERS):
            for ti in VERIFIED_INDICES:
                if ti == vi:
                    continue
                target_db_id = me_ids[PLAYERS[ti]["clerkId"]]
                resp = await c.post(f"{BASE}/matches/{match_id}/verify",
                    json={"targetPlayerId": target_db_id, "vote": 1},
                    headers=hdrs(voter["clerkId"]))
                label = f"{voter['username']} approves {PLAYERS[ti]['username']}"
                if resp.status_code == 400 and ("Already voted" in resp.text or "already voted" in resp.text.lower()):
                    print(f"   OK   {label} (already cast)")
                else:
                    ok(resp, label)

        # Step 10.5: Reject P5 and P6 explicitly
        print("\n== Step 10.5: Reject P5 and P6 explicitly (0 votes) ==")
        for vi in range(3):  # First 3 players reject P5 and P6
            voter = PLAYERS[vi]
            for ti in VOIDED_INDICES:
                if ti == vi:
                    continue
                target_db_id = me_ids[PLAYERS[ti]["clerkId"]]
                resp = await c.post(f"{BASE}/matches/{match_id}/verify",
                    json={"targetPlayerId": target_db_id, "vote": 0},
                    headers=hdrs(voter["clerkId"]))
                label = f"{voter['username']} rejects {PLAYERS[ti]['username']}"
                if resp.status_code == 400 and ("Already voted" in resp.text or "already voted" in resp.text.lower()):
                    print(f"   OK   {label} (already cast)")
                else:
                    ok(resp, label)

        # Step 11: Complete match
        print("\n== Step 11: Host completes match ==")
        resp = await c.post(f"{BASE}/matches/{match_id}/complete", headers=hdrs(host["clerkId"]))
        cd = ok(resp, "Complete match")
        print(f"        results: {cd.get('results', [])}")

        # Step 12: After snapshot + assertions
        print("\n== Step 12: AFTER snapshot & assertions ==")
        after = {}
        for p in PLAYERS:
            resp = await c.get(f"{BASE}/profile/me", headers=hdrs(p["clerkId"]))
            u = (resp.json().get("data") or resp.json().get("player") or resp.json())
            after[p["clerkId"]] = {
                "matchesPlayed":      u.get("matchesPlayed", 0),
                "goals":              u.get("goals", 0),
                "assists":            u.get("assists", 0),
                "progressionPoints":  u.get("progressionPoints", 0),
                "verifiedMatchCount": u.get("verifiedMatchCount", 0),
            }

        print("\n" + "="*80)
        print(f"{'Player':<22} {'Expect':<10} {'mp':>4} {'g':>4} {'a':>4} {'vMC':>4} {'PP':>5}  Result")
        print("-"*80)
        all_passed = True
        for i, p in enumerate(PLAYERS):
            cid = p["clerkId"]
            b, a = before[cid], after[cid]
            exp = "VERIFIED" if i in VERIFIED_INDICES else "VOIDED"

            if i in VERIFIED_INDICES:
                passed = (
                    a["matchesPlayed"]      > b["matchesPlayed"] and
                    a["goals"]              >= b["goals"] + STATS[i]["goals"] and
                    a["assists"]            >= b["assists"] + STATS[i]["assists"] and
                    a["verifiedMatchCount"] > b["verifiedMatchCount"] and
                    a["progressionPoints"]  > b["progressionPoints"]
                )
            else:
                passed = (
                    a["matchesPlayed"]      == b["matchesPlayed"] and
                    a["goals"]              == b["goals"] and
                    a["verifiedMatchCount"] == b["verifiedMatchCount"]
                )

            mark = "PASS" if passed else "FAIL"
            if not passed:
                all_passed = False
            print(f"{p['username']:<22} {exp:<10} {a['matchesPlayed']:>4} {a['goals']:>4} {a['assists']:>4} {a['verifiedMatchCount']:>4} {a['progressionPoints']:>5}  {mark}")

        print("="*80)

        if all_passed:
            print("\n  ALL ASSERTIONS PASSED - stats pipeline is working correctly!\n")
            sys.exit(0)
        else:
            print("\n  SOME ASSERTIONS FAILED - check table above.\n")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run())

