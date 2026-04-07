import type {
	IAuthenticate,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class GranolaApi implements ICredentialType {
	name = 'granolaApi';

	displayName = 'Granola API';

	icon: Icon = {
		light: 'file:../nodes/Granola/Granola.svg',
		dark: 'file:../nodes/Granola/Granola.dark.svg',
	};

	documentationUrl = 'https://docs.granola.ai/introduction';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			required: true,
			default: '',
			typeOptions: {
				password: true,
			},
			description: 'Create an API key in the Granola desktop app under Settings > API',
		},
	];

	authenticate: IAuthenticate = async (credentials, requestOptions) => {
		return {
			...requestOptions,
			headers: {
				...requestOptions.headers,
				Authorization: `Bearer ${credentials.apiKey as string}`,
			},
		};
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://public-api.granola.ai/v1',
			url: '/notes',
			method: 'GET',
			qs: {
				page_size: 1,
			},
		},
	};
}