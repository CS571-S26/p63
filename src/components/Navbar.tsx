import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from 'react-bootstrap'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase'
import UserMenu from './UserMenu'
import rmrLogo from '../assets/RMRlogo.png'
import './Navbar.css'

interface SearchResult {
	id: string
	entryId: string
	source: 'user' | 'roommate'
	name?: string
	location?: string
	rating?: number
}

export default function Navbar() {
	const navigate = useNavigate()
	const routeLocation = useLocation()
	const [isSignedIn, setIsSignedIn] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [searchMode, setSearchMode] = useState<'name' | 'location'>('name')
	const [results, setResults] = useState<SearchResult[]>([])
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [isSearching, setIsSearching] = useState(false)
	const debounceRef = useRef<number | null>(null)
	const searchRequestId = useRef(0)
	const wrapperRef = useRef<HTMLDivElement>(null)

	const isHomePage = routeLocation.pathname === '/'

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setIsSignedIn(Boolean(user))
		})
		return () => unsubscribe()
	}, [])

	// Close dropdown when navigating away
	useEffect(() => {
		setIsDropdownOpen(false)
		setSearchTerm('')
		setResults([])
	}, [routeLocation.pathname])

	// Close dropdown on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setIsDropdownOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])

	async function runSearch(term: string, mode: 'name' | 'location') {
		const termLower = term.trim().toLowerCase()
		if (!termLower) {
			setResults([])
			setIsDropdownOpen(false)
			return
		}

		const requestId = ++searchRequestId.current
		setIsSearching(true)

		try {
			const [usersResult, roommatesResult] = await Promise.allSettled([
				getDocs(collection(db, 'users')),
				getDocs(collection(db, 'roommates')),
			])

			if (requestId !== searchRequestId.current) return

			const users: SearchResult[] = usersResult.status === 'fulfilled'
				? usersResult.value.docs.map((doc) => {
					const d = doc.data()
					return {
						id: `user-${doc.id}`,
						entryId: doc.id,
						source: 'user' as const,
						name: [d.firstName, d.lastName].filter(Boolean).join(' ') || (d.name as string | undefined),
						location: d.location as string | undefined,
						rating: typeof d.rating === 'number' ? d.rating : undefined,
					}
				})
				: []

			const roommates: SearchResult[] = roommatesResult.status === 'fulfilled'
				? roommatesResult.value.docs.map((doc) => {
					const d = doc.data()
					return {
						id: `roommate-${doc.id}`,
						entryId: doc.id,
						source: 'roommate' as const,
						name: d.name as string | undefined,
						location: d.location as string | undefined,
						rating: typeof d.averageRating === 'number' ? d.averageRating : undefined,
					}
				})
				: []

			const filtered = [...users, ...roommates].filter((r) => {
				const field = mode === 'name'
					? (r.name ?? '').toLowerCase()
					: (r.location ?? '').toLowerCase()
				return field.includes(termLower)
			})

			if (requestId !== searchRequestId.current) return

			setResults(filtered.slice(0, 8))
			setIsDropdownOpen(true)
		} finally {
			if (requestId === searchRequestId.current) setIsSearching(false)
		}
	}

	function handleSearchChange(value: string) {
		setSearchTerm(value)
		if (debounceRef.current) window.clearTimeout(debounceRef.current)
		if (!value.trim()) {
			setResults([])
			setIsDropdownOpen(false)
			return
		}
		debounceRef.current = window.setTimeout(() => void runSearch(value, searchMode), 300)
	}

	function handleModeChange(mode: 'name' | 'location') {
		setSearchMode(mode)
		if (searchTerm.trim()) {
			if (debounceRef.current) window.clearTimeout(debounceRef.current)
			void runSearch(searchTerm, mode)
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			if (debounceRef.current) window.clearTimeout(debounceRef.current)
			void runSearch(searchTerm, searchMode)
		}
		if (e.key === 'Escape') {
			setIsDropdownOpen(false)
		}
	}

	function handleResultClick(result: SearchResult) {
		setIsDropdownOpen(false)
		navigate(`/roommates/${result.source}/${result.entryId}`)
	}

	return (
		<header className="navbar navbar-dark bg-black fixed-top border-bottom border-secondary" aria-label="Top navigation">
			<div className="container-xl px-3 px-sm-4 rmp-navbar-inner">
				<Link to="/" className="navbar-brand m-0 d-inline-flex align-items-center rmp-navbar-brand" aria-label="Home">
					<img src={rmrLogo} alt="Rate My Roommate" className="rmp-home-logo" />
				</Link>

				{!isHomePage && (
					<div className="rmp-navbar-search" role="search" ref={wrapperRef}>
						<div className="rmp-navbar-search-wrap">
							<svg className="rmp-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<circle cx="11" cy="11" r="8" />
								<line x1="21" y1="21" x2="16.65" y2="16.65" />
							</svg>
							<input
								type="text"
								className="rmp-navbar-search-input"
								placeholder={searchMode === 'name' ? 'Search by name…' : 'Search by location…'}
								value={searchTerm}
								onChange={(e) => handleSearchChange(e.target.value)}
								onKeyDown={handleKeyDown}
								onFocus={() => { if (results.length > 0) setIsDropdownOpen(true) }}
								aria-label={searchMode === 'name' ? 'Search roommates by name' : 'Search roommates by location'}
								aria-expanded={isDropdownOpen}
								aria-autocomplete="list"
								autoComplete="off"
							/>
							{isSearching && (
								<span className="rmp-search-spinner" aria-hidden="true" />
							)}

							{isDropdownOpen && (
								<div className="rmp-search-dropdown" role="listbox">
									{results.length === 0 ? (
										<div className="rmp-search-dropdown-empty">No results found</div>
									) : (
										results.map((r) => (
											<button
												key={r.id}
												type="button"
												role="option"
												className="rmp-search-dropdown-item"
												onClick={() => handleResultClick(r)}
											>
												<span className="rmp-sdi-name">{r.name ?? 'Unnamed'}</span>
												<span className="rmp-sdi-meta">
													{r.location ? <span className="rmp-sdi-location">{r.location}</span> : null}
													{typeof r.rating === 'number' ? (
														<span className="rmp-sdi-rating">★ {r.rating.toFixed(1)}</span>
													) : null}
												</span>
											</button>
										))
									)}
								</div>
							)}
						</div>
						<div className="rmp-search-mode-toggle" role="group" aria-label="Search mode">
							<button
								type="button"
								className={`rmp-mode-btn${searchMode === 'name' ? ' active' : ''}`}
								onClick={() => handleModeChange('name')}
							>
								Name
							</button>
							<button
								type="button"
								className={`rmp-mode-btn${searchMode === 'location' ? ' active' : ''}`}
								onClick={() => handleModeChange('location')}
							>
								Location
							</button>
						</div>
					</div>
				)}

				<div className="d-flex align-items-center gap-2 rmp-navbar-auth">
					{isSignedIn ? (
						<UserMenu />
					) : (
						<>
							<Button type="button" variant="" className="rmp-auth-btn rmp-login-btn" onClick={() => navigate('/login')}>Log In</Button>
							<Button type="button" variant="outline-light" className="rmp-auth-btn" onClick={() => navigate('/signup')}>Sign Up</Button>
						</>
					)}
				</div>
			</div>
		</header>
	)
}
