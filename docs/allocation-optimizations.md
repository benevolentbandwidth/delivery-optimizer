# Allocation Reduction — Implementation & Evaluation Report

Status: **implemented and measured**. All 80 unit tests pass (75 pre-existing + 5 new),
including under ASAN+UBSAN. One optimization (P0-7) was **scrapped** after measurement
showed it saved zero allocations.

---

## How this was evaluated

A dedicated benchmark harness was added (`bench/allocation_bench.cpp`, built with
`-DDELIVERYOPTIMIZER_ENABLE_BENCHMARKS=ON`, off by default). It overrides global
`operator new`/`new[]`/aligned-new to count allocations and bytes, and replays each
hot-path function with a representative 1000-job / 50-vehicle workload:

- `parse-request` — async worker: `ParseJsonText` + `ParseAndValidateOptimizeRequest`
- `parse-vroom-output` — runner: `ParseJsonText` over a 33 KB vroom output document
- `vroom-payload` — `BuildVroomInput`+render vs `BuildVroomInputText`
- `success-body` — `BuildOptimizeSuccessBody`
- `to-coordinated` / `worker-flow` — `ToCoordinatedSolveResult` and the worker loop sequence
- `log-line` — per-request `LogSolveRequest`
- `request-context` — `EnsureRequestContext`/`GetRequestContext`/`CreateSolveLifecycle`
- `http-json-response-copy|move` — drogon response construction, both overloads
- `write-payload-string|stream` — replicated `WritePayloadToFile` variants
- `spawn-args-baseline|optimized` — replicated `BuildSpawnArguments` variants
- `closure-sbo-single-ptr|heap-big-capture` — std::function capture-size mechanism

Allocation counts are bit-stable across runs (only wall time varies ±5%).

### Measured results (per iteration)

| Scenario | Baseline allocs | Optimized allocs | Δ allocs | Δ bytes | Δ time |
|---|---|---|---|---|---|
| parse-request | 17 846 | 16 814 | **−1 032** | −113 KB | −2% |
| parse-vroom-output | 3 255 | 3 239 | **−16** | −5.4 KB | −6% |
| vroom-payload | 40 130 | **1** | **−40 129 (>−99.99%)** | −3.14 MB (−94%) | −94% |
| success-body | 7 794 | 3 497 | **−4 297 (−55%)** | −314 KB | −51% |
| to-coordinated | 6 478 | 3 239 | **−3 239 (−50%)** | −246 KB | −51% |
| worker-flow | 14 272 | 3 497 | **−10 775 (−76%)** | −805 KB | −73% |
| log-line | 32 | 1 | **−31 (−97%)** | −3.3 KB | −88% |
| request-context | 12 | 4 | **−8 (−67%)** | −320 B | negligible |
| http-json-response copy→move | 6 481 | 3 242 | **−3 239 (−50%)** | −246 KB | −52% |
| write-payload string→stream | 786 | 765 | −21 | −132 KB | ~same |
| spawn-args | 4 | 0 | **−4 (−100%)** | −504 B | negligible |
| closure capture >16 B → 1 ptr | 5 | 0 | **−5 (−100%)** | −392 B | negligible |

The sum of representative synchronous stages for the 1000-job fixture drops from
**78 773 allocations to 26 798 (−66%)** and from **6.26 MB to 2.20 MB (−65%)**,
before any VROOM subprocess work. This is a stage-level estimate rather than an
end-to-end latency claim; external routing and solver time still dominate real solves.

### Next system-level opportunities

These are intentionally not mixed into the measured patch:

1. **Replace one-process-per-solve with a supervised long-lived VROOM pool or service.**
   `ProcessVroomRunner` still creates a temp file and uses `posix_spawn` for every solve.
   A bounded worker pool would remove process startup and file I/O, but needs worker
   recycling, hard timeouts, crash isolation, and backpressure before it is production-safe.
2. **Stop blocking HTTP event loops on PostgreSQL.** Job submission/status endpoints still
   call `execSqlSync`. Move endpoint-facing queries to Drogon's async/coroutine APIs while
   preserving the atomic admission transaction; keep blocking calls only on dedicated workers.
3. **Move request parsing off the JsonCpp DOM.** The remaining `parse-request` path is
   16 814 allocations for the fixture. A typed/on-demand parser (for example simdjson)
   should be evaluated behind the existing `OptimizeRequestInput` boundary. This is the
   largest remaining in-process allocation source, but changes validation/error behavior.
4. **Persist normalized async-job input.** Async submissions parse for validation and the
   durable worker parses the stored JSON again. Storing a versioned normalized payload plus
   external-ID metadata could remove the second parse while preserving restart durability;
   it requires a schema/version migration strategy.
5. **Measure with live OSRM/VROOM traffic.** The allocation harness isolates C++ overhead.
   Production p50/p95/p99, queue wait, subprocess startup, routing latency, and RSS should
   drive whether parser work or runner architecture is the next bottleneck.

---

## Per-optimization verdicts

### KEPT — P0-1 `ToCoordinatedSolveResult` takes `VroomRunResult&&` (moves output)
`solve_execution.cpp`/`.hpp`. `to-coordinated`: 6 478 → 3 239 allocs (−50%). The
jsoncpp 1.9.5 `Json::Value` copy is a full recursive deep copy (no COW), so the old
const-ref signature duplicated the whole vroom output tree once per solve.
Callers updated: `solve_coordinator.cpp` (drop `const`, `std::move`),
`optimization_job_runtime.cpp`.

### KEPT — P0-2 `BuildOptimizeSuccessBody` takes `Json::Value` by value, moves subtrees
`optimize_request.cpp`/`.hpp`. `success-body`: 7 794 → 3 497 allocs (−55%). `summary`,
`routes`, `unassigned` are moved out of the (now-owned) output instead of deep-copied.
`BuildSolveExecutionResult` now takes `CoordinatedSolveResult` and the optional forecast
by value so both trees can be moved through. Test updated to pass `std::move(vroom_output)`.

### KEPT — P0-3 WorkerLoop assignment is a move, not a copy
`optimization_job_runtime.cpp`. `worker-flow`: 14 272 → 3 497 allocs (−76%) — the
combination of P0-1 + P0-2 + this move eliminates two full output-tree copies per
async job.

### KEPT — P0-4 `WritePayloadToFile` no longer renders JSON
`vroom_runner.cpp`. Superseded by P2-1: the payload is text end-to-end and is written
straight to the descriptor returned by `mkstemp`, with no JSON writer, intermediate string,
`ofstream` buffer, or close/reopen cycle. The standalone stream-writer micro-optimization
(786 → 765 allocs, −132 KB) is therefore moot in the real pipeline.

### KEPT — P0-5 external-id `std::map` → direct request-vector indexing
`optimize_request.cpp`. VROOM ids are contiguous 1..N (we emit them), so lookup is
O(1) indexing directly into `input.jobs`/`input.vehicles`, with no map nodes, copied
keys, or temporary pointer vectors. Lookups remain bounds-checked for malformed
solver output. Included in the `success-body` numbers.

### SCRAPPED — P0-7 lazy validation field names
`optimize_request.cpp` (reverted). Measured impact: **0 heap allocations**. libc++
small-string optimization (22 bytes) absorbs `"vehicles[12]"`/`"jobs[999]"` (≤ 15
chars at the 10k/2k limits), so per-item `base_field` strings never allocate. The
replacement added code for no allocation benefit; reverted to the original loop.
The initial −16 parse delta came from reader reuse; the later vector reserve/move changes
account for the additional reduction shown in the final table.

### KEPT — P0-6 header/attribute key strings allocated once
`observability.hpp` (new `RequestIdHeaderName()`), `request_context.cpp` (file-local
`const std::string` key), `api_server.cpp` (8 call sites). `GetRequestContext` now
returns a request-owned pointer instead of copying the UUID. `request-context`:
12 → 4 allocs (−67%); applies to every request/response in the server, including the
response-creation advice.

### KEPT — P1-1 reusable `thread_local` JSON `CharReader`
`libs/adapters/src/json_utils.cpp`. Verified in the vendored jsoncpp that
`OurReader::parse()` resets `nodes_`/`comments_`/`errors_` at entry, so reuse is
safe. Saves ~16 allocations per parse (builder settings map + reader construction);
parses run per solve output, per async job claim, and per stored-job re-parse.
Request validation also reserves its job/vehicle vectors, materializes each ID once,
and moves parsed records into the final vectors instead of copying their optional time-window
vectors. This brings `parse-request` to −1 032 allocations while `parse-vroom-output` is −16.

### KEPT — P1-2 `LogSolveRequest` renders the flat log line directly
`observability.cpp`. 32 → 1 allocation (−97%), 3.7 KB → 348 B. JSON field names,
ordering and escaping are preserved byte-for-byte (verified against a live server
log line: `{"request_id":...,"method":"POST","path":...,"outcome":"failed",...}`).

### KEPT — P1-3 per-request closures bundled into one `SyncSolveContext`
`endpoints/deliveries_optimize_endpoint.cpp`. Deferred functions capture one shared
request aggregate instead of a ~184-byte state set (heap closure + re-copied weather
strings, ×2 on the weather re-run path). The aggregate directly owns request input,
lifecycle, response callback/response, forecast, and the weather adjustment. An
aliasing `shared_ptr` exposes the lifecycle without another object/control-block
allocation. The capture mechanism measures 5 allocations/construction → 0.

### REVERTED — P1-4 `CreateJob` stores the raw request body
`endpoints/optimization_jobs_endpoint.cpp`. JsonCpp accepts extensions such as comments
and trailing commas that PostgreSQL `jsonb` rejects, so binding `request->body()` could
turn a validated submission into a database error. The endpoint again renders the validated
DOM to canonical JSON before binding it. `CreateJob` still accepts a `std::string_view`, but
the intermediate full-size canonical string is required at this parser/database boundary.

### KEPT — P1-5 spawn arguments use stable fixed-size storage
`vroom_runner.cpp`. A fixed `argv` array points at `runtime_config_` members, literals,
and an inline `to_chars` timeout buffer. This both avoids stale self-referential string
pointers after a move and removes vector/string allocation: 4 → 0 allocations per solve.

### KEPT — P1-6 drogon `newHttpJsonResponse(Json::Value&&)` move overload
`deliveries_optimize_endpoint.cpp`, `optimization_jobs_endpoint.cpp`. The move
overload halves response construction (6 481 → 3 242 allocs on the 33 KB fixture;
proportionally more for large success bodies). Applied to error/validation/status
bodies and `BuildSolveExecutionResponse` (now by-value, moving both solver output
and forecast subtrees).

### KEPT — P2-1 VROOM payload rendered directly to text
`optimize_request.cpp` (`BuildVroomInputText`), `forecast_optimizer.cpp`
(`BuildWeatherAdjustedVroomInputText` → delegates with the service adjustment),
`vroom_runner.hpp/.cpp` (`Run(const std::string&)`), `solve_coordinator.hpp`
(`PayloadFactory = std::function<std::string()>`). Replaces the per-node
`Json::Value` tree + `writeString` render (~5 nodes + string per job): 40 130 → 1
allocation, 3.35 MB → 212 KB, 2.70 ms → 0.15 ms per 1000-job payload.
The renderer uses `std::to_chars` (shortest round-trip doubles), one capacity estimate,
and a shared compact JSON escaper. Request validation rejects malformed UTF-8 external IDs
before they reach the renderer. Four unit tests assert round-trip parity, escaping
(`order-"quoted"\path`), service adjustment, and overflow-safe service clamping.

### KEPT — P2-2 OSRM proxy path built in one reserved buffer
`endpoints/osrm_proxy_endpoint.cpp`. 3 allocations → 1 for long route paths.

### KEPT — P2-3 stored async results stay serialized
`optimization_job_store.cpp` and `optimization_jobs_endpoint.cpp`. PostgreSQL already returns
`result_json::text`; the store now keeps that validated JSON as text. Status queries do not
select the result column at all, and result reads move its text directly into a JSON HTTP response
instead of building another JsonCpp tree. Result persistence also reuses one immutable writer
configuration rather than rebuilding its settings map per completion.

### KEPT — harness + fixes
- `bench/` target behind `DELIVERYOPTIMIZER_ENABLE_BENCHMARKS` (default OFF).
- `tests/CMakeLists.txt`: link order fix (`GTest::gtest_main` before drogon's
  transitive static Boost archives) so the test binary links at all in this
  environment — a pre-existing failure unrelated to allocations.

---

## Testing

| Check | Result |
|---|---|
| Unit tests (Release) | 80/80 pass — 75 pre-existing + 5 new (`BuildVroomInputText` round-trip, service adjustment, overflow clamping, compactness, and malformed-UTF-8 ID validation) |
| Unit tests (ASAN+UBSAN) | 80/80 pass, no sanitizer reports |
| Local HTTP integration | Health, sync solve, external-ID response, and PostgreSQL async-job end-to-end tests pass |
| Server smoke test | Starts; `/health` correct; sync optimize path executes (validation → admission → spawn → log line); log line byte-identical to previous JSON format |
| Benchmark stability | Allocation counts identical across repeat runs |

Not run: docker-based e2e suites (require vroom/OSRM/postgres containers) — the text
payload format is covered by the round-trip unit tests and the previous Value-based
builder is byte-equivalent in field semantics.

## Reproduce

```sh
cmake -S . -B build/build/Release -DDELIVERYOPTIMIZER_ENABLE_BENCHMARKS=ON
cmake --build build/build/Release --target deliveryoptimizer_tests deliveryoptimizer_alloc_bench
./build/build/Release/tests/deliveryoptimizer_tests
./build/build/Release/bench/deliveryoptimizer_alloc_bench
```
