import { useState } from 'react';

const useBoolean = (value) => {
    const [boolean, setBoolean] = useState(value);
    const toggle = () => setBoolean((state) => !state);
    return [boolean, toggle];
};

export default useBoolean;
