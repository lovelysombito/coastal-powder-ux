import { useState } from 'react';
import { getSearchResult } from '../../../server/index';
import { Form } from 'react-bootstrap'
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import LinkedListGroup from '../list-group';
import Swal from 'sweetalert2';




const SearchBar = () => {
  const [posts, setPosts] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [keyword, setKeyword] = useState()

  const handleSubmit = (e) => {
    // e.preventDefault()
    if (keyword === '' || keyword === null || keyword === undefined) {
      Swal.fire({
        title: 'Please enter keyword to search!',
        showDenyButton: false,
        confirmButtonText: 'Ok',
        denyButtonText: `Cancel`,
      })
    } else {
      getSearchResult(keyword).then(res => {
        setPosts(res)
        setSearchResults(res.data)
      })
      if (!e.target.value) return setSearchResults(posts)

      const resultsArray = posts.filter(post => post.title.includes(e.target.value) || post.body.includes(e.target.value))

      setSearchResults(resultsArray)
    }


  }
  const handleSearchChange = (e) => {
    e.preventDefault()
    setKeyword(e.target.value);
    setSearchResults(0)
  }

  return (
    <>

      <InputGroup >
        <Form.Control
          placeholder="Search Site .... "
          aria-label="Search Site .... "
          aria-describedby="basic-addon2"
          value={keyword} onChange={handleSearchChange}
          autoFocus
        />
        <Button onClick={handleSubmit} variant="outline-secondary" id="button-addon2">
          Search
        </Button>
      </InputGroup>

      {searchResults.count > 0 &&


        <>

          <LinkedListGroup filteredResults={searchResults} />

        </>

      }
    </>
  );
};

export default SearchBar