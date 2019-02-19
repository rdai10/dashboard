import { GraphQLClient } from 'graphql-request'
import auth from '../../../auth'

export default new GraphQLClient('https://api.github.com/graphql', {
	headers: {
		Authorization: `Bearer ${auth.github.token}`,
	},
})
