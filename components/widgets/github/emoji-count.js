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

const EMOJI_URL = 'https://github.githubassets.com/images/icons/emoji'

export default class GitHubEmojiCount extends Component {
	static defaultProps = {
		interval: 1000 * 60 * 5,
		title: 'GitHub PR Emoji Count',
	}

	state = {
		prBody: [],
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

	filterDuplicates(array) {
		let dedupMap = new Map()

		array.forEach(emojiName => {
			if (emojiName) {
				if (dedupMap.has(emojiName)) {
					const count = dedupMap.get(emojiName)

					dedupMap.set(emojiName, count + 1)
				} else {
					dedupMap.set(emojiName, 1)
				}
			}
		})

		return dedupMap
	}

	parseEmojis(array) {
		const bodyString = array
			.map(item => item.node.bodyHTML)
			.map(string => string.match(/\/unicode\/([\d\w]+\.png)/g))
			.flat()

		return this.filterDuplicates(bodyString)
	}

	processPullRequestBody(array) {
		const preprocessedPrBody = this.parseEmojis(array)

		let prBodyArray = []

		for (const [key, value] of preprocessedPrBody) {
			prBodyArray.push({ name: `${EMOJI_URL}${key}`, count: `${value}` })
		}

		return prBodyArray
	}

	async fetchInformation() {
		const { authKey, owner, repository } = this.props
		const opts = authKey ? { headers: basicAuthHeader(authKey) } : {}

		try {
			const res = await client.request(`
			query {
			  repository(owner:"johnnyduong", name:"dashboard") {
				pullRequests(last:10) {
				  totalCount
				  edges{
					node {
					  bodyHTML
					}
				  }
				}
			  }
			}
		`)

			const prBody = this.processPullRequestBody(
				res.repository.pullRequests.edges
			)

			this.setState({
				prBody: prBody,
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
		const { prBody, error, loading } = this.state
		const { title } = this.props

		return (
			<Widget title={title} loading={loading} error={error}>
				{prBody &&
					prBody.map((body, index) => (
						<div key={index}>
							<img src={body.name} width="24px" height="24px" /> :{' '}
							{body.count}
						</div>
					))}

				{!prBody.length && (
					<div>No emoji was used in the last 10 pull requests 😢</div>
				)}
			</Widget>
		)
	}
}
