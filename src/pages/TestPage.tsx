import '../App.css'
import { Card } from 'react-bootstrap'
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function TestPage() {

    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        // console.log("db instance:", db);

        getDocs(collection(db, "projects")).then((snapshot) => {
            console.log("Response recieved!");

            const projs = snapshot.docs.map(doc => {
                return {
                    id: doc.id,
                    ...doc.data()
                }
            });

            setProjects(projs);
            console.log("Projects:", projects);
        })
    }, [])

    return (
        <div className="w-100 h-100 d-flex justify-content-center align-items-center">
            <Card className='m-4 p-2'>
                <Card.Body className='text-center'>
                    <h2>TestPage</h2>
                    <p>Example declarative routing with react-router-dom.</p>

                    {
                        projects.map(p => (
                            <div key={p.id} style={{ border: "1px solid black", margin: "10px", padding: "10px" }}>
                                <h3>{p.name}</h3>
                                <p>{p.description}</p>
                            </div>
                        ))
                    }
                </Card.Body>
            </Card>
        </div>
    )
}
// function useEffect(arg0: () => void, arg1: never[]) {
//     throw new Error('Function not implemented.');
// }

