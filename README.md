# n8n-nodes-redis-cluster

This is a n8n community node. It lets you use the Redis Cluster client in your n8n workflows. It uses the
`createCluster` client from node-redis ^4.6.4, allowing to connect to e.g. AWS MemoryDB.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Development](#development)  
[Resources](#resources)  
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community
nodes documentation.

Note: this node is not published in the npm Registry so you'll have to install manually.

### Installing in custom Docker container

- Checkout this repository
- Build using `npm install && npm run build`
- Copy to your custom Docker container in your Dockerfile using
	`COPY <path_to>/n8n-nodes-redis-cluster /home/node/.n8n/custom/`, place it at the end before `ENTRYPOINT`

## Operations

Same as the Redis Node except KEYS/INFO are removed.

## Credentials

Use Redis Cluster Credentials.

Note: Due to a bug in n8n, when the credentials are tested, the editor will report a failure although things are
actually working.

## Compatibility

Tested with n8n 0.214.2.

## Development

- Install and run a [Redis Cluster](https://redis.io/docs/management/scaling/#create-and-use-a-redis-cluster) locally
	(easiest is to use the `utils/create-cluster` util).
- Build and run this node (`git clone ...`, `npm install`, `npm run build`)
- Set up n8n locally:

```sh
git clone https://github.com/n8n-io/n8n.git
git checkout tags/n8n@0.214.2
pnpm install
pnpm build
```

- And run: `N8N_CUSTOM_EXTENSIONS=/path/to/n8n-nodes-redis-cluster/dist pnpm start`

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## Version history

### 1.0.0

- Initial version
