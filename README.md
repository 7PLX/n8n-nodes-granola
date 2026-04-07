# @7plx/n8n-nodes-granola

This is an n8n community node. It lets you use Granola in your n8n workflows.

Granola is an AI-powered meeting notes application. This node lets you list accessible meeting notes and fetch a single note with its AI summary, attendee metadata, and optional transcript.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Note
- Get a note by ID
- Get many notes with optional date filters and pagination

## Credentials

Use a Granola API key.

Create it in the Granola desktop app under Settings > API, then add it to the Granola API credential in n8n.

Granola supports:

- Personal API keys for notes you can access personally
- Enterprise API keys for Team space access on Enterprise plans

## Compatibility

This package targets the current n8n community node API v1 and the Granola public REST API documented in April 2026.

## Usage

Granola only returns notes that already have an AI summary and transcript. Notes that are still processing are excluded from list results, and fetching them directly returns a 404.

For Get Many, the node returns one n8n item per note. When Return All is enabled, it follows Granola's cursor pagination automatically.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Granola API introduction](https://docs.granola.ai/introduction.md)
- [Granola List Notes endpoint](https://docs.granola.ai/api-reference/list-notes.md)
- [Granola Get Note endpoint](https://docs.granola.ai/api-reference/get-note.md)

## Version history

### 0.1.0

Initial release with Granola note retrieval support.
