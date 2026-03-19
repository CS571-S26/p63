import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import '../App.css'

export default function Layout() {
    return (
        <div className="app-shell">
            <Navbar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    )
}
