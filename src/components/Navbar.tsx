import { Link, useNavigate } from 'react-router-dom'
import { Button } from 'react-bootstrap'
import rmrLogo from '../assets/RMRlogo.png'
import './Navbar.css'

export default function Navbar() {
	const navigate = useNavigate()

	return (
		<header className="navbar navbar-dark bg-black fixed-top border-bottom border-secondary" aria-label="Top navigation">
			<div className="container-xl px-3 px-sm-4">
				<Link to="/" className="navbar-brand m-0 d-inline-flex align-items-center" aria-label="Home">
					<img src={rmrLogo} alt="Rate My Roommate" className="rmp-home-logo" />
				</Link>

				<div className="d-flex align-items-center gap-2">
					<Button type="button" variant="" className="rmp-auth-btn rmp-login-btn" onClick={() => navigate('/login')}>Log In</Button>
					<Button type="button" variant="outline-light" className="rmp-auth-btn">Sign Up</Button>
				</div>
			</div>
		</header>
	)
}
