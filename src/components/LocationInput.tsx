import { useEffect, useRef, useState } from 'react'
import { Form } from 'react-bootstrap'
import './LocationInput.css'

interface NominatimResult {
	place_id: number
	display_name: string
}

interface LocationInputProps {
	id: string
	label: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	disabled?: boolean
}

export default function LocationInput({ id, label, value, onChange, placeholder = 'City, State', disabled = false }: LocationInputProps) {
	const [suggestions, setSuggestions] = useState<string[]>([])
	const [isOpen, setIsOpen] = useState(false)
	const [isFetching, setIsFetching] = useState(false)
	const debounceRef = useRef<number | null>(null)
	const requestIdRef = useRef(0)
	const wrapperRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])

	function handleChange(raw: string) {
		onChange(raw)

		if (debounceRef.current) window.clearTimeout(debounceRef.current)

		if (!raw.trim()) {
			setSuggestions([])
			setIsOpen(false)
			return
		}

		debounceRef.current = window.setTimeout(() => void fetchSuggestions(raw), 350)
	}

	async function fetchSuggestions(term: string) {
		const id = ++requestIdRef.current
		setIsFetching(true)

		try {
			const url = new URL('https://nominatim.openstreetmap.org/search')
			url.searchParams.set('q', term)
			url.searchParams.set('format', 'json')
			url.searchParams.set('limit', '6')
			url.searchParams.set('addressdetails', '0')

			const response = await fetch(url.toString(), {
				headers: { 'Accept-Language': 'en' },
			})

			if (!response.ok || id !== requestIdRef.current) return

			const data = (await response.json()) as NominatimResult[]

			if (id !== requestIdRef.current) return

			const names = data.map((r) => r.display_name)
			setSuggestions(names)
			setIsOpen(names.length > 0)
		} catch {
			// Network failure — silently degrade, user can still type freely
		} finally {
			if (id === requestIdRef.current) setIsFetching(false)
		}
	}

	function handleSelect(suggestion: string) {
		onChange(suggestion)
		setSuggestions([])
		setIsOpen(false)
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Escape') setIsOpen(false)
	}

	return (
		<Form.Group controlId={id} className="location-input-group" ref={wrapperRef}>
			<Form.Label>{label}</Form.Label>
			<div className="location-input-wrap">
				<Form.Control
					type="text"
					value={value}
					onChange={(e) => handleChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
					placeholder={placeholder}
					disabled={disabled}
					autoComplete="off"
					aria-label={label}
					aria-expanded={isOpen}
					aria-autocomplete="list"
				/>
				{isFetching && <span className="location-input-spinner" aria-hidden="true" />}
			</div>

			{isOpen && (
				<ul className="location-suggestions" role="listbox">
					{suggestions.map((s) => (
						<li key={s} role="option" aria-selected={false}>
							<button
								type="button"
								className="location-suggestion-item"
								onClick={() => handleSelect(s)}
							>
								{s}
							</button>
						</li>
					))}
				</ul>
			)}
		</Form.Group>
	)
}
