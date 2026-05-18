## Summary

- 

## Motivation

- 

## Changes

- 

## Validation

### Frontend

- [ ] `npm --prefix app/ui run lint`
- [ ] `npm --prefix app/ui run format:check`
- [ ] `npm --prefix app/ui run typecheck`
- [ ] `npm --prefix app/ui run test`
- [ ] `npm --prefix app/ui run build`
- [ ] `npm --prefix app/mobile run lint`
- [ ] `npm --prefix app/mobile run typecheck`

### Backend

- [ ] `cmake --preset dev`
- [ ] `.github/scripts/check-backend-static.sh build/dev`
- [ ] `cmake --build --preset dev --parallel`
- [ ] `ctest --preset dev --output-on-failure --no-tests=error -LE 'e2e|docker'`
- [ ] `docker compose -f deploy/compose/docker-compose.arm64.yml --env-file deploy/env/http-server.arm64.env config`

## Risk

- 

## Rollout and Recovery

- 

## High-Signal PR Checklist

- [ ] The summary states the user-visible or operational outcome, not just file names.
- [ ] The motivation explains why this change is needed now.
- [ ] The change list separates frontend, backend, infrastructure, and documentation work where applicable.
- [ ] Validation includes exact commands run, relevant output, and any checks intentionally skipped.
- [ ] Risks, migrations, feature flags, and rollback steps are called out when relevant.
- [ ] Screenshots or request/response examples are included for UI and API behavior changes.
