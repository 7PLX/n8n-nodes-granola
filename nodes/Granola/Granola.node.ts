import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeProperties,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

interface GranolaUser {
	name: string | null;
	email: string;
}

interface GranolaNoteSummary {
	id: string;
	object: 'note';
	title: string | null;
	owner: GranolaUser;
	created_at: string;
	updated_at: string;
	[key: string]: unknown;
}

interface GranolaListNotesResponse {
	notes: GranolaNoteSummary[];
	hasMore: boolean;
	cursor: string | null;
}

async function granolaApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	itemIndex: number,
	qs: IDataObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `https://public-api.granola.ai/v1${endpoint}`,
		json: true,
		qs,
	};

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'granolaApi',
		options,
	)) as IDataObject;
}

async function getNotes(
	this: IExecuteFunctions,
	itemIndex: number,
	query: IDataObject,
	returnAll: boolean,
	limit: number,
): Promise<GranolaNoteSummary[]> {
	const notes: GranolaNoteSummary[] = [];
	let cursor = query.cursor as string | undefined;

	do {
		const remaining = limit - notes.length;
		const pageSize = returnAll ? 30 : Math.min(Math.max(remaining, 1), 30);
		const requestQuery: IDataObject = {
			...query,
			page_size: pageSize,
		};

		if (cursor) {
			requestQuery.cursor = cursor;
		}

		const response = (await granolaApiRequest.call(
			this,
			'GET',
			'/notes',
			itemIndex,
			requestQuery,
		)) as unknown as GranolaListNotesResponse;

		notes.push(...response.notes);
		cursor = response.cursor ?? undefined;

		if (!returnAll && notes.length >= limit) {
			return notes.slice(0, limit);
		}

		if (!response.hasMore || !cursor) {
			break;
		}
	} while (returnAll || notes.length < limit);

	return notes;
}

export class Granola implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Granola',
		name: 'granola',
		icon: 'file:Granola.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Read meeting notes, AI summaries, and transcripts from Granola',
		defaults: {
			name: 'Granola',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'granolaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'note',
				options: [
					{
						name: 'Note',
						value: 'note',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'getMany',
				displayOptions: {
					show: {
						resource: ['note'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a note by ID',
						action: 'Get a note',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'List accessible notes',
						action: 'Get many notes',
					},
				],
			},
			{
				displayName: 'Note ID',
				name: 'noteId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'not_1d3tmYTlCICgjy',
				displayOptions: {
					show: {
						resource: ['note'],
						operation: ['get'],
					},
				},
				description: 'The note ID to retrieve',
			},
			{
				displayName: 'Include Transcript',
				name: 'includeTranscript',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['note'],
						operation: ['get'],
					},
				},
				description: 'Whether to include the transcript in the note response',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['note'],
						operation: ['getMany'],
					},
				},
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				displayOptions: {
					show: {
						resource: ['note'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				description: 'Max number of results to return',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['note'],
						operation: ['getMany'],
					},
				},
				options: [
					{
						displayName: 'Created After',
						name: 'createdAfter',
						type: 'string',
						default: '',
						placeholder: '2026-01-27T15:30:00Z',
						description: 'Return notes created after this ISO date or date-time',
					},
					{
						displayName: 'Created Before',
						name: 'createdBefore',
						type: 'string',
						default: '',
						placeholder: '2026-01-27T15:30:00Z',
						description: 'Return notes created before this ISO date or date-time',
					},
					{
						displayName: 'Updated After',
						name: 'updatedAfter',
						type: 'string',
						default: '',
						placeholder: '2026-01-27T15:30:00Z',
						description: 'Return notes updated after this ISO date or date-time',
					},
					{
						displayName: 'Cursor',
						name: 'cursor',
						type: 'string',
						default: '',
						description: 'Start listing notes from an existing Granola pagination cursor',
					},
				],
			},
			] as INodeProperties[],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource !== 'note') {
					continue;
				}

				if (operation === 'get') {
					const noteId = this.getNodeParameter('noteId', itemIndex) as string;
					const includeTranscript = this.getNodeParameter(
						'includeTranscript',
						itemIndex,
						false,
					) as boolean;
					const query: IDataObject = {};

					if (includeTranscript) {
						query.include = 'transcript';
					}

					const response = await granolaApiRequest.call(
						this,
						'GET',
						`/notes/${noteId}`,
						itemIndex,
						query,
					);

					returnData.push({
						json: response,
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				if (operation === 'getMany') {
					const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
					const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
					const additionalFields = this.getNodeParameter(
						'additionalFields',
						itemIndex,
						{},
					) as IDataObject;
					const query: IDataObject = {};

					if (additionalFields.createdAfter) {
						query.created_after = additionalFields.createdAfter as string;
					}

					if (additionalFields.createdBefore) {
						query.created_before = additionalFields.createdBefore as string;
					}

					if (additionalFields.updatedAfter) {
						query.updated_after = additionalFields.updatedAfter as string;
					}

					if (additionalFields.cursor) {
						query.cursor = additionalFields.cursor as string;
					}

					const notes = await getNotes.call(this, itemIndex, query, returnAll, limit);

					for (const note of notes) {
						returnData.push({
							json: note as unknown as IDataObject,
							pairedItem: { item: itemIndex },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [returnData];
	}
}