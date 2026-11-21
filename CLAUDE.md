# Nurse RPG

A fork of the OSCE gym for one uncomplicated birth. The player picks a role. Doctor and midwife conduct the delivery and the third stage. The AED nurse learns and does her own job on a separate bench. Do not put the other stations back. Do not add complications, traps, or a viva.

The birth benches stay for the doctor and the midwife (`src/game/delivery/`). The nurse bench is `src/game/nurse/`. Role wording is `src/game/delivery/roles.ts`, applied from `?role=` on the play route. The jazz bed is original and lives in `src/game/sfx.ts`.

## Commands

- `npm run typecheck` and `npm test` before every commit.
- `npm run dev` serves on port 8080.

Legacy packs under `content/packs/` stay so the engine tests have fixtures. The player catalog offers only `og-delivery`.
