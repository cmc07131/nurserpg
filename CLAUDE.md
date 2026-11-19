# Nurse RPG

A fork of the OSCE gym for one uncomplicated birth. The player picks a role (doctor, midwife, or AED nurse) and walks the same delivery and third stage. The AED nurse's preparation is nursing management of the room. Do not put the other stations back. Do not add complications, traps, or a viva.

The birth and third-stage benches stay as they are (`src/game/delivery/`). Role wording is `src/game/delivery/roles.ts`, applied from `?role=` on the play route. The jazz bed is original and lives in `src/game/sfx.ts`.

## Commands

- `npm run typecheck` and `npm test` before every commit.
- `npm run dev` serves on port 8080.

Legacy packs under `content/packs/` stay so the engine tests have fixtures. The player catalog offers only `og-delivery`.
