# Minimal Ethereum Mixer

This is the monorepo for all code and documentation for a minimal Ethereum
mixer. It allows you to cryptographically break the link between a source and
destination address for ETH transfers. It does this via zero-knowledge proofs
which let withdrawals occur securely without revealing the original address
which made a deposit. It relies on a centralised broadcaster server, but the
system is non-custodial and trustless.

A technical specification can be found
[here](https://hackmd.io/qlKORn5MSOes1WtsEznu_g).

## Getting started

First, install `npx`.

```bash
npm install -g npx
```

Clone this repository and its `semaphore` submodule:

```bash
git clone git@github.com:weijiekoh/mixer.git && \
cd mixer && \
git submodule update --init
```

Install dependencies and build the source code:

```bash
npx lerna bootstrap && \
npx lerna run build
```

**TODO**

## Full documentation

**TODO**

### Directory structure

- `frontend/`: source code for the UI
- `contracts/`: source code for mixer contracts and tests
- `semaphore/`: a submodule for the [Semaphore code](https://github.com/weijiekoh/semaphore)

### Frontend

See the frontend documentation [here](./frontend).

## Contributing pull requests

Please make pull requests against the `develop` branch.

Each PR should contain a clear description of the feature it adds or problem it
solves (the **why**), and walk the user through a summary of **how** it solves
it.

Each PR should also add to the unit and/or integration tests as appropriate.

## Governance and project management

**TODO**

## Code of conduct and reporting

**TODO**
