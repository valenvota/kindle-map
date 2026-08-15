// Loci L1 — migration regression test (pure planner). No test framework, no deps.
//
// Run:  node scripts/testLocusMigration.ts        (Node 24 strips the TS natively)
// Exits non-zero (throws) if any invariant regresses, so a future session can
// re-verify the v11→v12 migration logic straight from the repo. Touches no
// IndexedDB and no real data — it only exercises `planLocusMigration`, the pure
// transform the Dexie `.upgrade()` in src/db/db.ts is a thin wrapper around.
// The live Dexie upgrade wiring is covered separately by the disposable browser
// integration test (see the Slice 1 verification notes).

import { planLocusMigration } from '../src/db/locusMigration.ts';
import type { KindleMap } from '../src/types/map.ts';
import type { CanvasNodeData } from '../src/types/canvas.ts';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.error(`FAIL  ${name}`, extra ?? ''); }
}

const NOW = '2026-08-14T00:00:00.000Z';
let idc = 0;
const newRootId = () => `locus-TEST-${++idc}`;

function m(over: Partial<KindleMap>): KindleMap {
  return { id: 'x', name: 'x', createdAt: NOW, updatedAt: NOW, ownerId: 'owner-A', ...over };
}

// Apply a plan to arrays, mimicking what the Dexie upgrade does, so we can re-run
// the planner on the *result* and assert idempotency.
function apply(maps: KindleMap[], nodes: CanvasNodeData[], plan: ReturnType<typeof planLocusMigration>) {
  const outMaps = maps.map((x) => ({ ...x }));
  for (const r of plan.rootsToAdd) outMaps.push({ ...r });
  for (const rp of plan.mapsToReparent) {
    const t = outMaps.find((x) => x.id === rp.id)!;
    t.parentId = rp.parentId;
  }
  const outNodes = nodes.map((x) => ({ ...x })).concat(plan.roomNodesToAdd.map((x) => ({ ...x })));
  return { outMaps, outNodes };
}

// ── Scenario 1: fresh migration, one owner, 3 live maps ─────────────────────
{
  idc = 0;
  const maps: KindleMap[] = [
    m({ id: 'map-1', name: 'Reading', createdAt: '2026-01-01T00:00:00.000Z' }),
    m({ id: 'map-2', name: 'University' }),
    m({ id: 'map-3', name: 'Business' }),
  ];
  const before = JSON.stringify(maps);
  const plan = planLocusMigration({ maps, roomNodes: [], now: NOW, newRootId });

  check('S1 input not mutated (planner is pure)', JSON.stringify(maps) === before);
  check('S1 exactly one root created', plan.rootsToAdd.length === 1);
  check('S1 root has isRoot + no parent', !!plan.rootsToAdd[0].isRoot && !plan.rootsToAdd[0].parentId);
  check('S1 root id is owner-independent', !plan.rootsToAdd[0].id.includes('owner-A'));
  check('S1 root inherits owner', plan.rootsToAdd[0].ownerId === 'owner-A');
  check('S1 every map re-parented', plan.mapsToReparent.length === 3);
  const rootId = plan.rootsToAdd[0].id;
  check('S1 all reparented to the root', plan.mapsToReparent.every((r) => r.parentId === rootId));
  check('S1 one room card per map', plan.roomNodesToAdd.length === 3);
  check('S1 cards are room nodes on the root', plan.roomNodesToAdd.every((n) => n.type === 'room' && n.mapId === rootId));
  check('S1 card roomIds cover all maps',
    new Set(plan.roomNodesToAdd.map((n) => n.roomId)).size === 3 &&
    plan.roomNodesToAdd.every((n) => ['map-1', 'map-2', 'map-3'].includes(n.roomId!)));
  check('S1 card names denormalized', plan.roomNodesToAdd.find((n) => n.roomId === 'map-1')!.content === 'Reading');
  check('S1 card positions distinct', new Set(plan.roomNodesToAdd.map((n) => `${n.position.x},${n.position.y}`)).size === 3);

  // No data loss: after apply, all original maps still present and unchanged except parentId.
  const { outMaps, outNodes } = apply(maps, [], plan);
  check('S1 no map lost', ['map-1', 'map-2', 'map-3'].every((id) => outMaps.some((x) => x.id === id)));
  check('S1 original fields intact', outMaps.find((x) => x.id === 'map-1')!.name === 'Reading');

  // Idempotency: re-run on the applied result → empty plan.
  const plan2 = planLocusMigration({ maps: outMaps, roomNodes: outNodes.filter((n) => n.type === 'room'), now: NOW, newRootId });
  check('S1 idempotent: no new root', plan2.rootsToAdd.length === 0);
  check('S1 idempotent: no reparent', plan2.mapsToReparent.length === 0);
  check('S1 idempotent: no new cards', plan2.roomNodesToAdd.length === 0);
}

// ── Scenario 2: tombstoned map → reparented, but no card ────────────────────
{
  idc = 0;
  const maps: KindleMap[] = [
    m({ id: 'map-live', name: 'Live' }),
    m({ id: 'map-dead', name: 'Dead', deletedAt: '2026-05-05T00:00:00.000Z' }),
  ];
  const plan = planLocusMigration({ maps, roomNodes: [], now: NOW, newRootId });
  check('S2 both reparented', plan.mapsToReparent.length === 2);
  check('S2 only live map carded', plan.roomNodesToAdd.length === 1 && plan.roomNodesToAdd[0].roomId === 'map-live');
}

// ── Scenario 3: multi-owner → one root each ─────────────────────────────────
{
  idc = 0;
  const maps: KindleMap[] = [
    m({ id: 'a1', ownerId: 'owner-A' }),
    m({ id: 'b1', ownerId: 'owner-B' }),
    m({ id: 'b2', ownerId: 'owner-B' }),
  ];
  const plan = planLocusMigration({ maps, roomNodes: [], now: NOW, newRootId });
  check('S3 two roots (one per owner)', plan.rootsToAdd.length === 2);
  const rootA = plan.rootsToAdd.find((r) => r.ownerId === 'owner-A')!;
  const rootB = plan.rootsToAdd.find((r) => r.ownerId === 'owner-B')!;
  check('S3 owners isolated', !!rootA && !!rootB && rootA.id !== rootB.id);
  const bCards = plan.roomNodesToAdd.filter((n) => n.mapId === rootB.id);
  check('S3 owner-B has 2 cards', bCards.length === 2);
  check('S3 no cross-owner reparent',
    plan.mapsToReparent.find((r) => r.id === 'a1')!.parentId === rootA.id &&
    plan.mapsToReparent.find((r) => r.id === 'b1')!.parentId === rootB.id);
}

// ── Scenario 4: pre-existing root is reused, not duplicated ──────────────────
{
  idc = 0;
  const maps: KindleMap[] = [
    m({ id: 'root-existing', name: 'My Locus', isRoot: true, createdAt: '2025-01-01T00:00:00.000Z' }),
    m({ id: 'child-1', parentId: 'root-existing' }), // already parented
    m({ id: 'child-2' }),                            // needs reparent
  ];
  const plan = planLocusMigration({ maps, roomNodes: [], now: NOW, newRootId });
  check('S4 no root created (reused)', plan.rootsToAdd.length === 0);
  check('S4 only the unparented child reparented',
    plan.mapsToReparent.length === 1 && plan.mapsToReparent[0].id === 'child-2' &&
    plan.mapsToReparent[0].parentId === 'root-existing');
  check('S4 cards for both non-root children',
    plan.roomNodesToAdd.length === 2 &&
    new Set(plan.roomNodesToAdd.map((n) => n.roomId)).size === 2);
  check('S4 cards attach to existing root', plan.roomNodesToAdd.every((n) => n.mapId === 'root-existing'));
}

// ── Scenario 5: duplicate isRoot (future L7 edge) → earliest canonical, no delete ─
{
  idc = 0;
  const maps: KindleMap[] = [
    m({ id: 'root-late', isRoot: true, createdAt: '2026-02-02T00:00:00.000Z' }),
    m({ id: 'root-early', isRoot: true, createdAt: '2026-01-01T00:00:00.000Z' }),
    m({ id: 'child' }),
  ];
  const plan = planLocusMigration({ maps, roomNodes: [], now: NOW, newRootId });
  check('S5 no new root minted', plan.rootsToAdd.length === 0);
  check('S5 earliest root is canonical', plan.mapsToReparent[0]?.parentId === 'root-early');
  // The planner returns no instruction to delete/merge the extra root — it is
  // simply left in place for L7 reconciliation. (Nothing in the plan touches it.)
  check('S5 extra root left untouched',
    !plan.mapsToReparent.some((r) => r.id === 'root-late') &&
    !plan.roomNodesToAdd.some((n) => n.roomId === 'root-late'));
}

// ── Scenario 6: empty DB → nothing to do ────────────────────────────────────
{
  idc = 0;
  const plan = planLocusMigration({ maps: [], roomNodes: [], now: NOW, newRootId });
  check('S6 empty in → empty plan',
    plan.rootsToAdd.length === 0 && plan.mapsToReparent.length === 0 && plan.roomNodesToAdd.length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} migration regression assertion(s) failed`);
