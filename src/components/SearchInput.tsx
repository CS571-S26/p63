import { Form } from 'react-bootstrap'
import './SearchInput.css'

interface SearchInputProps {
  id: string
  placeholder: string
  value?: string
  onChange?: (value: string) => void
}

export default function SearchInput({id, placeholder, value = '', onChange}: SearchInputProps) {
  return (
    <Form.Group className="search-input-group" controlId={id}>
      <Form.Control
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Form.Group>
  )
}
