import { Component } from 'react'
import client from './client'
import { object, string, number } from 'yup'
import Widget from '../../widget'
import { basicAuthHeader } from '../../../lib/auth'

const schema = object().shape({
	owner: string().required(),
	repository: string().required(),
	interval: number(),
	title: string(),
	authKey: string(),
})

export default class GitHubEmojiCount extends Component {
	static defaultProps = {
		interval: 1000 * 60 * 5,
		title: 'GitHub PR Emoji Count',
	}

	state = {
		bodyText: '',
		error: false,
		loading: true,
	}

	componentDidMount() {
		schema
			.validate(this.props)
			.then(() => this.fetchInformation())
			.catch(err => {
				console.error(
					`${err.name} @ ${this.constructor.name}`,
					err.errors
				)
				this.setState({ error: true, loading: false })
			})
	}

	componentWillUnmount() {
		clearTimeout(this.timeout)
	}

	async fetchInformation() {
		const { authKey, owner, repository } = this.props
		const opts = authKey ? { headers: basicAuthHeader(authKey) } : {}

		try {
			const res = await client.request(`
			query {
			  repository(owner:"johnnyduong", name:"dashboard") {
				pullRequest(number: 1) {
				  body
				}
			  }
			}
          `)

			this.setState({
				bodyText: res.repository.pullRequest.body,
				error: false,
				loading: false,
			})
		} catch (error) {
			this.setState({ error: true, loading: false })
		} finally {
			this.timeout = setTimeout(
				() => this.fetchInformation(),
				this.props.interval
			)
		}
	}

	render() {
		const { bodyText, error, loading } = this.state
		const { title } = this.props
		return (
			<Widget title={title} loading={loading} error={error}>
				<div>
					{' '}
					<span role="img" aria-label="thumbs up">
						👍:
					</span>{' '}
					847
				</div>

				<div>
					{' '}
					<span role="img" aria-label="thumbs down">
						👎:
					</span>{' '}
					847
				</div>
			</Widget>
		)
	}
}
